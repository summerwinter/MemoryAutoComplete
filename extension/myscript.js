// global functions or variables to be invoked
function show_welcome() {
	$("#extension_intro_btn").click();
}
var suggestion_num_config = 5;

function myscript_init() {
	if ($(".ace_editor").length == 0)
		return;

var listen_keyboard = true;
var last_prefix = "";
var editor_enabled = true;
var debug = false;

var dict = {
	changed: false,
	words_list: new Array(),
	words_list_map: {},
	fuse_options: {
		keys: ["word"],
		id: "word",
		shouldSort: true,
		sortFn: function(a, b) {
			if (Math.abs(a.score - b.score) < 0.01) {
				return a.item.freq - b.item.freq;
			}
			return a.score - b.score;
		}
	},
	fuse_debug_options: {
		keys: ["word"],
		includeScore: true,
		shouldSort: true,
		sortFn: function(a, b) {
			if (Math.abs(a.score - b.score) < 0.01) {
				return a.item.freq - b.item.freq;
			}
			return a.score - b.score;
		}
	},
	fuse: undefined,
	destructor : function() {
    	this.save_storage();
    },
    save_storage: function() {
    	if (dict.changed)
    		dict.changed = false;
    	else
    		return;
    	var url = window.location.href;
    	var key = url + "_words";
    	var items = {}
    	items[key] = dict.words_list
    	chrome.storage.local.set(items, function(){
    	});
    },
	init: function() {
		if (debug == false)
			this.fuse = new Fuse(this.words_list, this.fuse_options);
		else
			this.fuse = new Fuse(this.words_list, this.fuse_debug_options);

		var url = window.location.href;
		var key = url + "_words";
		chrome.storage.local.get(key, function(items){
			if (key in items) {
				dict.words_list = items[key]
				dict.construct_list_map();
				dict.fuse.setCollection(dict.words_list)
			}
		});

		setInterval(function() {
			dict.save_storage();
		}, 10000);
	},
	construct_list_map: function() {
		dict.words_list_map = {}
		this.words_list.forEach(function(element, idx) {
			dict.words_list_map[element["word"]] = idx;
		});
	},
	store_word: function(word) {
		// console.log("pre store word: " + word);
		// console.log(this.words_list);
		// console.log(this.words_list_map);

		if (word.length <= 3) {
			return;
		}

		var idx = -1;
		if (word in this.words_list_map) {
			idx = this.words_list_map[word]
		}
		if (idx >= 0) {
			this.words_list[idx].freq += 1
		}
		else {
			this.words_list.push({word: word, freq: 1});
			this.words_list_map[word] = this.words_list.length - 1
		}
		this.changed = true;
		// console.log("store word: " + word);
		// console.log(this.words_list);
		// console.log(this.words_list_map);
	},
	del_word: function(word) {
		var idx = -1;
		if (word in this.words_list_map) {
			idx = this.words_list_map[word]
		}
		if (idx < 0)
			return;

		if (idx == this.words_list.length - 1) {
			this.words_list.splice(this.words_list.length - 1, 1);
			delete this.words_list_map[word];
		}
		else {
			this.words_list[idx] = this.words_list[this.words_list.length - 1];
			this.words_list.splice(this.words_list.length - 1, 1);
			delete this.words_list_map[word];
			this.words_list_map[this.words_list[idx].word] = idx;
		}
		this.changed = true;
		// console.log("del word: " + word);
		// console.log(this.words_list);
		// console.log(this.words_list_map);
	},
	search: function(word) {
		var result = this.fuse.search(word);
		// not show same word
		if (result.length > 0 &&
		    ((debug && result[0].item.word == word) ||
		     (!debug && result[0] == word)
		    )
		   ) {
			return result.slice(1, suggestion_num_config);
		}
		else {
			return result.slice(0, suggestion_num_config);
		}
	}
};

var manifest = chrome.runtime.getManifest();
var extension_version = manifest.version;
var how_to_use = 'This extension is for Ace Editor auto completion, based on input history.<h4>How to use?</h4><ul><li>The first time you use it, there is nothing for auto completion. Don\'t worry, just type it.</li><li>Use <b>Tab, Up, Down</b> to change selection</li><li>Use <b>Enter</b> or <b>Click</b> to input selection</li><li>Click <b>extension icon</b>(top right corner) to find more functions<ul><li>Change suggestion num</li><li>Configure your auto completion dictionary</li></ul></li></ul>';
var improvements = '<h5>ChangeLog</h5><ul><li>V1.5: add more shortcut keys</li><li>V1.4: add help document</li></ul>';

$("body").append('<button id="extension_intro_btn" type="button" class="btn btn-primary" data-toggle="modal" data-target="#extensionIntroModal"></button><!-- Modal --><div class="modal fade" id="extensionIntroModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true"><div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-header"><h3 class="modal-title" id="exampleModalLabel">Welcome</h3></div><div class="modal-body">' + how_to_use + improvements + '</div><div class="modal-footer"><button type="button" class="btn btn-primary" data-dismiss="modal">I got it~</button></div></div></div></div>');

$("body").append('<button id="extension_btn_test" style="display: none;" data="" onclick="javascript: var pos = extension_editor.getCursorPosition(); var word_range = extension_editor_session.getWordRange(pos.row, pos.column); console.log(pos); console.log(word_range);"></button>');
$("body").append('<button id="extension_insert_str" style="display: none;" data="" onclick="javascript: extension_editor.insert($(this).attr(\'data\'));"></button>');
$("body").append('<button id="extension_focus" style="display: none;" data="" onclick="javascript: extension_editor.focus();"></button>');
$("body").append('<button id="extension_prefix_str" style="display: none;" onclick="javascript: var pos = extension_editor.getCursorPosition(); var word_range = extension_editor_session.getWordRange(pos.row, pos.column); var word = extension_editor_doc.getTextRange(word_range); $(this).attr(\'pos\', pos.row + \' \' + pos.column); $(this).attr(\'word_range_start\', word_range.start.row + \' \' + word_range.start.column); $(this).attr(\'word_range_end\', word_range.end.row + \' \' + word_range.end.column); $(this).attr(\'word\', word);"></button>');
$("body").append('<button id="extension_replace_str" style="display: none;" prefix="" word="" onclick="javascript: var prefix=$(this).attr(\'prefix\'); var pos = extension_editor.getCursorPosition(); var word=$(this).attr(\'word\'); var range = extension_editor_session.getWordRange(pos.row, pos.column); range.start.row = pos.row; range.start.column = pos.column - prefix.length; range.end.row = pos.row; range.end.column = pos.column; extension_editor_doc.replace(range, word);"></button>');
$("body").append('<button id="extension_read_only" style="display: none;" onclick="javascript: extension_editor.setReadOnly(true);"></button>');
$("body").append('<button id="extension_enable_write" style="display: none;" onclick="javascript: extension_editor.setReadOnly(false);"></button>');
$("body").append('<button id="extension_undo" style="display: none;" onclick="javascript: extension_editor.undo();"></button>');
$("body").append('<button id="extension_event" style="display: none;" onclick="javascript: console.log(getEventListeners($(\'textarea.ace_text-input\').get(0)));"></button>');
$("body").append('<button id="extension_cancel_events" style="display: none;" onclick="javascript: var events_arr = [\'keypress\', \'keyup\', \'keydown\']; var obj = $(\'textarea.ace_text-input\').get(0); events_arr.forEach(function(event_name) { var events = obj.eventListenerList[event_name]; if (events) events.forEach(function(f) {obj.removeEventListener(event_name, f); }); });"></button>');
$("body").append('<button id="extension_restore_events" style="display: none;" onclick="javascript: var events_arr = [\'keypress\', \'keyup\', \'keydown\']; var obj = $(\'textarea.ace_text-input\').get(0);  events_arr.forEach(function(event_name) { var events = obj.eventListenerList[event_name]; if (events) events.forEach(function(f) {obj.addEventListener(event_name, f, false, true);}); });"></button>');

function init_ace() {
	var extension_script = document.createElement("script");
	extension_script.type = "text/javascript";
	extension_script.text = "if (!$('div.ace_editor').attr('id')) $('div.ace_editor').attr('id', 'extension_ace_editor'); var extension_editor = ace.edit(document.getElementsByClassName('ace_editor')[0].getAttribute('id')); extension_editor.$blockScrolling = Infinity; var extension_editor_session = extension_editor.getSession(); var extension_editor_doc = extension_editor_session.getDocument(); function extension_post_msg(type, text) {window.postMessage({ source: 'FROM_PAGE', type: type, text: text }, '*');}";
	$("head").append(extension_script);
}

init_ace();

function welcome() {
	var url = window.location.href;
	var key = url + "_version";
	chrome.storage.local.get(key, function(items) {
		if (key in items) {
			var storage_version = items[key];
			if (storage_version == extension_version) {
				return;
			}
		}
		items = {}
		items[key] = extension_version;

		chrome.storage.local.set(items, function() {});
		show_welcome();
	});
}

welcome();

window.addEventListener("message", function(event) {
	// console.log(event);
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.source && (event.data.source == "FROM_PAGE")) {
    
  }
}, false);

function delete_test() {
	$("#extension_btn_test").click();
}

function editor_insert_str(str) {
	$("#extension_insert_str").attr("data", str);
	$("#extension_insert_str").click();
	editor_focus();
}

function editor_focus() {
	$("#extension_focus").click();
	// $("textarea.ace_text-input").focus();
}

function editor_get_prefix() {
	$("#extension_prefix_str").click();
	var word = $("#extension_prefix_str").attr("word");
	var pos_str_arr = $("#extension_prefix_str").attr("pos").split(" ");
	var word_range_start_str_arr = $("#extension_prefix_str").attr("word_range_start").split(" ");
	var word_range_end_str_arr = $("#extension_prefix_str").attr("word_range_end").split(" ");
	var pos = {
		row: parseInt(pos_str_arr[0]),
		column: parseInt(pos_str_arr[1])
	};
	var word_range = {
		start: {
			row: parseInt(word_range_start_str_arr[0]),
			column: parseInt(word_range_start_str_arr[1])
		},
		end: {
			row: parseInt(word_range_end_str_arr[0]),
			column: parseInt(word_range_end_str_arr[1])
		}
	};
	return {prefix: word.substr(0, pos.column - word_range.start.column), pos: pos, word_range: word_range};
}

function editor_remove_and_insert_str(prefix, insert_str) {
	$("#extension_replace_str").attr("prefix", prefix);
	$("#extension_replace_str").attr("word", insert_str);
	$("#extension_replace_str").click();
	editor_focus();
}

function editor_set_read_only(read_only) {
	if (read_only)
		$("#extension_read_only").click();
	else
		$("#extension_enable_write").click();
}

function editor_enable(enabled) {
	if (editor_enabled == enabled)
		return;
	editor_enabled = enabled;
	if (enabled) {
		$("#extension_restore_events").click();
	}
	else {
		$("#extension_cancel_events").click();
	}
}

function editor_undo() {
	$("#extension_undo").click();
}

function get_active_ace_line() {
	var active_line = $("div.ace_active-line");
	var height = active_line.height();
	var top = active_line.position().top;
	var idx = top / height;
	return $($(".ace_text-layer div.ace_line")[idx]);
}

function auto_complete_word(prefix, complete_word) {
	editor_remove_and_insert_str(prefix, complete_word);
}

$( window ).bind("beforeunload",function() {
       dict.destructor();
});

var textComplete = {
	init : function(){
		$("body").append("<div id='my_popup' style='max-width: 500px;min-width: 50px;word-wrap: break-word; z-index: 10000;'></div>");

		$("#my_popup").on("click", "li span.extension-word-del", function(e) {
			e.stopPropagation();
			dict.del_word($(this).parent().attr("data"));
			textComplete.draw($("#my_popup ul").attr("prefix"));
			editor_focus();
		});

		$("#my_popup").on("click", "li", function(e) {
			textComplete.trigger($(this).attr("data"));
		});
	},
	hide: function(){
		$("#my_popup").hide();
	},
	show: function(){
		$("#my_popup").show();
	},
	visible: function() {
		return $("#my_popup").is(":visible");
	},
	get_position: function(){
		var offset = $("textarea.ace_text-input").offset();
		return offset;
	},
	draw: function(prefix){
		if (prefix.length == 0) {
			this.hide();
			return;
		}
		// not show when only one or two digitals
		if (prefix.length <= 2) {
			var alpha = false;
			for (var i = 0, len = prefix.length; i < len; ++i) {
				var idx = prefix[i].charCodeAt(0);
				if (!(48 <= idx && idx <= 57)) {
					alpha = true;
					break;
				}
			}
			if (alpha == false) {
				this.hide();
				return;
			}
		}
		// var words = dictionary.pre_match(prefix)
		var words = dict.search(prefix)
		if(words.length == 0){
			this.hide()
		}
		else{
			this.show()
			var html = '';
			html += '<ul class="list-group" prefix="' + prefix + '">';
			for (i = 0, len = words.length; i < len; i++){
				if (debug == false)
					html += '<li style="padding: 5px 5px;" class="list-group-item d-flex justify-content-between align-items-center" data="' + words[i] + '">' + words[i] + '<span class="extension-word-del badge badge-primary badge-pill">X</span></li>';
				else
					html += '<li style="padding: 5px 5px;" class="list-group-item d-flex justify-content-between align-items-center" data="' + words[i].item.word + '">' + words[i].item.word + " " + words[i].item.freq + " " + words[i].score + '<span class="extension-word-del badge badge-primary badge-pill">X</span></li>';
			}
			html += '</ul>';
			offset = this.get_position();
			$("#my_popup").html(html);
			$($("#my_popup li")[0]).addClass("active");
			$("#my_popup").offset({top: offset.top + 17, left: offset.left});
		}
	},
	trigger : function(word){
		auto_complete_word($("#my_popup ul").attr("prefix"), word);
		event_handler.cur_word = word;
		last_prefix = word;
		this.hide();
	},
	next : function() {
		if (!this.visible())
			return false;
		if ($("#my_popup li").length <= 1)
			return true;
		var last_set_found = false;
		var next_set = false;
		var has_class_idx = 0;
		$("#my_popup li").each(function(idx, obj) {
			if ($(obj).hasClass("active")) {
				$(obj).removeClass("active");
				has_class_idx = idx;
			}
		});
		$($("#my_popup li")[(has_class_idx + 1 + $("#my_popup li").length) % $("#my_popup li").length]).addClass("active");
		return true;
	},
	prev : function() {
		if (!this.visible())
			return false;
		if ($("#my_popup li").length <= 1)
			return true;
		var last_set_found = false;
		var next_set = false;
		var has_class_idx = 0;
		$("#my_popup li").each(function(idx, obj) {
			if ($(obj).hasClass("active")) {
				$(obj).removeClass("active");
				has_class_idx = idx;
			}
		});
		$($("#my_popup li")[(has_class_idx - 1 + $("#my_popup li").length) % $("#my_popup li").length]).addClass("active");
		return true;
	},
	select : function() {
		if (!this.visible())
			return false;
		if ($("#my_popup li").length == 0)
			return false;

		$("#my_popup li.active").click();
		return true;
	}
};

$(".ace_editor").click(function() {
	textComplete.hide();
});

var event_handler = {
	cur_word : "",
	split_keys : new Array(),
	ignore_keys : new Array(),
	active_modifiers: {
        alt: false,
        meta: false,
        shift: false,
        ctrl: false
    },
    shift_modified_key_codes: {
    	"`" : "~",
    	"1" : "!",
    	"2" : "@",
    	"3" : "#",
    	"4" : "$",
    	"5" : "%",
    	"6" : "^",
    	"7" : "&",
    	"8" : "*",
    	"9" : "(",
    	"0" : ")",
    	"-" : "_",
    	"=" : "+",
    	"[" : "{",
    	"]" : "}",
    	";" : ":",
    	"'" : '"',
    	"," : "<",
    	"." : ">",
    	"/" : "?"
    },
    shift_modified_key_codes_map: {},
    modify_event: function(event) {
    	if (this.active_modifiers.shift) {
    		if (Object.keys(this.shift_modified_key_codes_map).length == 0) {
	    		for (var key in this.shift_modified_key_codes) {
	    			this.shift_modified_key_codes_map[key.charCodeAt(0)] = key;
	    		}
	    	}
	    	if (!(event.keyCode in this.shift_modified_key_codes_map)) {
	    		return;
	    	}
    		var key = this.shift_modified_key_codes_map[event.keyCode];
    		var val = this.shift_modified_key_codes[key];
    		event.keyCode = val.charCodeAt(0);
    	}
    },
	is_splited : function(event){
		return this.split_keys.includes(event.keyCode);
	},
	is_ignored : function(event) {
		return this.ignore_keys.includes(event.keyCode);
	},
	is_valid: function(str) {
		if (str.length == 0)
			return false;
		for (var i = 0, len = str.length; i < len; ++i) {
			var idx = str[i].charCodeAt(0);
			if (97 <= idx && idx <= 122)
				continue;
			if (65 <= idx && idx <= 90)
				continue;
			if (48 <= idx && idx <= 57)
				continue;
			if (str[i] == '-' || str[i] == '_')
				continue;
			return false;
		}
		return true;
	},
	init : function(){
		// 32 space
		// 8 backspace
		// 17 ctrl
		// 18 alt
		// 91 command
		// 13 enter
		// 188 ,
		// 186 ;
		// 222 '"
		// 40 (
		// 41 )
		// 191 /
		// 220 \
		// 187 =
		// 190 .
		this.split_keys = [32, 13, 188, 186, 222, 40, 41, 191, 220, 187, 190]
		// 16 shift
		// 42 *  
		this.ignore_keys = [16, 42]
		editor_enable(false);
		// $("textarea.ace_text-input")[0].addEventListener("keypress", function(event) {
		// 	if (event.keyCode == 9 && textComplete.visible() == true) {
		// 		// console.log("keypress prevent");
		// 		// $("#my_popup").focus();
		// 		return false;
		// 	}
		// });
		$("textarea.ace_text-input").keyup(function(event) {
			event_handler.modify_event(event);
			if (event.keyCode == 16) {
				event_handler.active_modifiers.shift = false;
			}
			// ESC hide
			if (event.keyCode == 27) {
				textComplete.hide();
				return;
			}
			if (textComplete.visible() == true) {
				// Tab, Up
				if (event.keyCode == 9 || event.keyCode == 40) {
					textComplete.next();
					editor_enable(true);
					return;
				}
				// Down
				if (event.keyCode == 38) {
					textComplete.prev();
					editor_enable(true);
					return;
				}
				// Enter
				if (event.keyCode == 13) {
					textComplete.select();
					return;
				}
			}
			var prefix_info = editor_get_prefix();
			var prefix = prefix_info["prefix"];
			if (!event_handler.is_valid(prefix))
				prefix = "";
			// console.log(last_prefix + " " + last_prefix.length + " " + prefix + " " + prefix.length + " " + event.keyCode);
			if (prefix.length == 0 && last_prefix.length > 0 && event_handler.split_keys.includes(event.keyCode)) {
				// dictionary.store_words(last_prefix);
				dict.store_word(last_prefix);
			}
			last_prefix = prefix;

			textComplete.draw(prefix);

		});
		$("textarea.ace_text-input").keydown(function(event) {
			if (event.keyCode == 16) {
				event_handler.active_modifiers.shift = true;
			}
			if (textComplete.visible() == true) {
				// Tab, Up, Down
				if (event.keyCode == 9 || event.keyCode == 38 || event.keyCode == 40) {
					editor_enable(false);
					return false;
				}
				// Enter
				if (event.keyCode == 13)
					return false;
			}
		});
		editor_enable(true);
	},
};

textComplete.init();
event_handler.init();
dict.init();
editor_focus();

}

myscript_init();