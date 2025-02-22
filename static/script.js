const form = document.getElementById("input_form");
const textInput = document.getElementById("text_input");
const imageInput = document.getElementById("image_input");
const imageCheck = document.getElementById("image_check");

// imageInput.addEventListener("change", () => {
//   form.submit();
// });

// window.addEventListener("paste", e => {
//   console.log("Paste received");
//   imageInput.files = e.clipboardData.files;
//   imageCheck.checked = true;
// });
document.onpaste = event => {
	event.preventDefault();
	clipboardData = (event.clipboardData || event.originalEvent.clipboardData);

	if (typeof clipboardData.files[0] == 'undefined') {
		textInput.value = clipboardData.getData('Text');
	} else {
		imageInput.files = clipboardData.files;
		imageCheck.checked = true;
	}
}
