$(document).ready(function() {
    $("#hello_page").show();
    $(".nav-item").click(function(event) {
        $(".nav-item").removeClass("active");
        $(".child_page").hide();
        $("#" + $(this).attr("data")).show();
        $(this).addClass("active");
    });

    $("#auto_complete_url_keys_select").on("change", function() {
        update_auto_complete_list($("#auto_complete_url_keys_select").val());
    });

    $("#delete_storage_btn").click(function() {
        var key = $("#auto_complete_url_keys_select_for_configure").val();
        chrome.storage.local.remove(key, function() {
            update_auto_complete_url_keys();
            update_auto_complete_url_keys_for_configure();
            alert("delete storage successed!");
        });
    });

    $("#clear_data_btn").click(function() {
        var key = $("#auto_complete_url_keys_select_for_configure").val();
        var items = {};
        items[key] = new Array();
        chrome.storage.local.set(items, function() {
            update_auto_complete_list($("#auto_complete_url_keys_select").val());
            alert("clear data successed!");
        });
    });

    $("#add_data_btn").click(function() {
        var val = $("#auto_complete_data_textarea").val();
        val = val.replace("\n", ",");
        val = val.replace(" ", "");
        var keywords = val.split(",");
        var key = $("#auto_complete_url_keys_select_for_configure").val();
        chrome.storage.local.get(key, function(items) {
            var cur_vals = {};
            if (key in items) {
                cur_vals = items[key];
            }
            var cur_val_map = {};
            cur_vals.forEach(function(element, idx) {
                cur_val_map[element.word] = idx;
            });
            keywords.forEach(function(element, idx) {
                if (element in cur_val_map) {
                    var element_idx = cur_val_map[element];
                    cur_vals[idx].freq += 1;
                }
                else {
                    var new_item = {};
                    new_item["word"] = element;
                    new_item["freq"] = 1;
                    cur_vals.push(new_item);
                }
            });

            items = {}
            items[key] = cur_vals;
            chrome.storage.local.set(items, function() {
                update_auto_complete_list($("#auto_complete_url_keys_select").val());
                alert("add data successed!");
            });
        });
    });

    $("#auto_complete_url_vals").on("click", "li span.extension-word-del", function(e) {
        e.stopPropagation();
        var key = $("#auto_complete_url_keys_select").val();
        var selected_word = $(this).parent().attr("data");
        chrome.storage.local.get(key, function(items) {
            if (key in items) {
                var values = items[key];
                var selected_idx = -1;
                values.forEach(function(element, idx) {
                    if (element.word == selected_word) {
                        selected_idx = idx;
                        return false;
                    }
                });
                if (selected_idx != -1) {
                    values.splice(selected_idx, 1);
                    items = {}
                    items[key] = values;
                    chrome.storage.local.set(items, function() {
                        update_auto_complete_list($("#auto_complete_url_keys_select").val());
                        alert("delete element successed!");
                    });
                }
            }
        });
    });

    function update_auto_complete_list(key) {
        $("#auto_complete_url_vals").html("");
        chrome.storage.local.get(key, function(items) {
            if (key in items) {
                var values = items[key];
                values.sort(function(a, b) {
                    return b.freq - a.freq;
                });
                var html = "";
                values.forEach(function(element, idx) {
                    html += '<li class="list-group-item d-flex justify-content-between align-items-center" data="' + element.word + '">' + element.word + '<span class="extension-word-del badge badge-primary badge-pill">' + element.freq + ' X</span></li>';
                });
                $("#auto_complete_url_vals").html(html);
            }
        });
    }

    function update_auto_complete_url_keys() {
        chrome.storage.local.get(null, function(items) {
            var html = '';
            var idx = 1;
            for (key in items) {
                html += '<option value="' + key + '">' + key + '</option>';
                idx += 1;
            }
            $("#auto_complete_url_keys_select").html(html);
            update_auto_complete_list($("#auto_complete_url_keys_select").val());
        });
    }

    update_auto_complete_url_keys();

    function update_auto_complete_url_keys_for_configure() {
        chrome.storage.local.get(null, function(items) {
            var html = '';
            var idx = 1;
            for (key in items) {
                html += '<option value="' + key + '">' + key + '</option>';
                idx += 1;
            }
            $("#auto_complete_url_keys_select_for_configure").html(html);
        });
    }

    update_auto_complete_url_keys_for_configure();

});