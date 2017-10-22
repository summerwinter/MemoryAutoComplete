var extension_script = document.createElement("script");
extension_script.type = "text/javascript";
extension_script.text = '(function() {Element.prototype._addEventListener = Element.prototype.addEventListener;Element.prototype.addEventListener = function(a,b,c,d=false) {this._addEventListener(a,b,c); if(d) return; if(!this.eventListenerList) this.eventListenerList = {};if(!this.eventListenerList[a]) this.eventListenerList[a] = [];this.eventListenerList[a].push(b);};})();'
document.documentElement.appendChild(extension_script);