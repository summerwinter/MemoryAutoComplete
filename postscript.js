console.log("script add event");
$("textarea.test")[0].addEventListener("keydown", function(event) {
				console.log("script keydown");
				return false;
			})