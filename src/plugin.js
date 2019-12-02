/**
 * @author [Joji Jacob]
 * @email [joji.jacob.k@gmail.com]
 * @create date 2019-12-01 12:31:50
 * @modify date 2019-12-01 12:31:50
 */

'use strict';

(function() {
  window.OfscPlugin = function(debugMode) {
    this.debugMode = debugMode || false;
  };

  Object.assign(window.OfscPlugin.prototype, {
    /**
     * Check for string is valid JSON
     *
     * @param {*} str - String that should be validated
     *
     * @returns {boolean}
     *
     * @private
     */
    _isJson: function(str) {
      try {
        JSON.parse(str);
      } catch (e) {
        return false;
      }
      return true;
    },

    /**
     * Return origin of URL (protocol + domain)
     *
     * @param {String} url
     *
     * @returns {String}
     *
     * @private
     */
    _getOrigin: function(url) {
      if (url != '') {
        if (url.indexOf('://') > -1) {
          return 'https://' + url.split('/')[2];
        } else {
          return 'https://' + url.split('/')[0];
        }
      }

      return '';
    },

    /**
     * Return domain of URL
     *
     * @param {String} url
     *
     * @returns {String}
     *
     * @private
     */
    _getDomain: function(url) {
      if (url != '') {
        if (url.indexOf('://') > -1) {
          return url.split('/')[2];
        } else {
          return url.split('/')[0];
        }
      }

      return '';
    },

    /**
     * Sends postMessage to document.referrer
     *
     * @param {Object} data - Data that will be sent
     *
     * @private
     */
    _sendPostMessageData: function(data) {
      const originUrl = document.referrer || (document.location.ancestorOrigins && document.location.ancestorOrigins[0]) || '';
      const isString = 'string' === typeof data;

      if (originUrl) {
        this._log(
          window.location.host + ' -> ' + (isString ? '' : data.method) + ' ' + this._getDomain(originUrl),
          isString ? data : JSON.stringify(data, null, 4)
        );

        parent.postMessage(data, this._getOrigin(originUrl));
      } else {
        this._log(window.location.host + ' -> ' + (isString ? '' : data.method) + ' ERROR. UNABLE TO GET REFERRER');
      }
    },

    /**
     * Handles during receiving postMessage
     *
     * @param {MessageEvent} event - Javascript event
     *
     * @private
     */
    _getPostMessageData: function(event) {
      if (typeof event.data === 'undefined') {
        this._log(window.location.host + ' <- NO DATA ' + this._getDomain(event.origin), null, null, true);

        return false;
      }

      if (!this._isJson(event.data)) {
        this._log(window.location.host + ' <- NOT JSON ' + this._getDomain(event.origin), null, null, true);

        return false;
      }

      const data = JSON.parse(event.data);

      if (!data.method) {
        this._log(window.location.host + ' <- NO METHOD ' + this._getDomain(event.origin), null, null, true);

        return false;
      }

      this._log(window.location.host + ' <- ' + data.method + ' ' + this._getDomain(event.origin), JSON.stringify(data, null, 4));

      switch (data.method) {
        case 'init':
          this.pluginInitEnd(data);
          break;

        case 'open':
          this.pluginOpen(data);
          break;

        case 'wakeup':
          this.pluginWakeup(data);
          break;

        case 'error':
          data.errors = data.errors || { error: 'Unknown error' };
          this.processProcedureResult(document, event.data);
          this._showError(data.errors);
          break;

        case 'callProcedureResult':
          this.processProcedureResult(document, event.data);
          break;

        default:
          this.processProcedureResult(document, event.data);
          this._log(window.location.host + ' <- UNKNOWN METHOD: ' + data.method + ' ' + this._getDomain(event.origin), null, null, true);
          break;
      }
    },

    /**
     * Show alert with error
     *
     * @param {Object} errorData - Object with errors
     *
     * @private
     */
    _showError: function(errorData) {
      alert(JSON.stringify(errorData, null, 4));
    },

    /**
     * Logs to console
     *
     * @param {String} title - Message that will be log
     * @param {String} [data] - Formatted data that will be collapsed
     * @param {String} [color] - Color in Hex format
     * @param {Boolean} [warning] - Is it warning message?
     *
     * @private
     */
    _log: function(title, data, color, warning) {
      if (!this.debugMode) {
        return;
      }
      if (!color) {
        color = '#0066FF';
      }
      if (!!data) {
        console.groupCollapsed(
          '%c[Plugin API] ' + title,
          'color: ' + color + '; ' + (!!warning ? 'font-weight: bold;' : 'font-weight: normal;')
        );
        console.log('[Plugin API] ' + data);
        console.groupEnd();
      } else {
        console.log('%c[Plugin API] ' + title, 'color: ' + color + '; ' + (!!warning ? 'font-weight: bold;' : ''));
      }
    },

    _getBlob: function(url) {
      return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();

        xhr.responseType = 'blob';
        xhr.open('GET', url, true);

        xhr.onreadystatechange = function() {
          if (xhr.readyState === xhr.DONE) {
            if (200 == xhr.status || 201 == xhr.status) {
              try {
                return resolve(xhr.response);
              } catch (e) {
                return reject(e);
              }
            }

            return reject(new Error('Server returned an error. HTTP Status: ' + xhr.status));
          }
        };

        xhr.send();
      });
    },

    /**
     * Business login on plugin init
     */
    saveToLocalStorage: function(data) {
      this._log(window.location.host + ' INIT. SET DATA TO LOCAL STORAGE', JSON.stringify(data, null, 4));
      const initData = {};
      const keysToAvoidStorage = ['apiVersion', 'method'];
      const keysForStorage = Object.keys(data).filter(
        originalKey => keysToAvoidStorage.findIndex(toAvoid => toAvoid === originalKey) == -1
      );
      keysForStorage.forEach(key => (initData[key] = data[key]));
      localStorage.setItem('pluginInitData', JSON.stringify(initData));
    },

    /**
     * Business login on plugin init end
     *
     * @param {Object} data - JSON object that contain data from OFSC
     */
    pluginInitEnd: function(data) {
      this.saveToLocalStorage(data);

      const messageData = {
        apiVersion: 1,
        method: 'initEnd'
      };

      this._sendPostMessageData(messageData);
    },

    /**
     * Business login on plugin open
     *
     * @param {Object} receivedData - JSON object that contain data from OFSC
     */
    pluginOpen: function(receivedData) {
      //   receivedData is the data received from OFSC. Do whatever you want with that data.
    },

    getCurrentTime: function() {
      const d = new Date();

      return '' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + '.' + ('00' + d.getMilliseconds()).slice(-3);
    },

    generateCallId: function() {
      return btoa(String.fromCharCode.apply(null, window.crypto.getRandomValues(new Uint8Array(16))));
    },

    /**
     * Initialization function
     */
    init: function() {
      this._log(window.location.host + ' PLUGIN HAS BEEN STARTED');

      window.addEventListener('message', this._getPostMessageData.bind(this), false);

      const jsonToSend = {
        apiVersion: 1,
        method: 'ready',
        sendInitData: true,
        showHeader: true,
        enableBackButton: true
      };

      //parse data items
      const dataItems = JSON.parse(localStorage.getItem('dataItems'));

      if (dataItems) {
        Object.assign(jsonToSend, { dataItems: dataItems });
      }

      this._sendPostMessageData(jsonToSend);
    }
  });
})();
