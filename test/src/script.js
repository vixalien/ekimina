const state = {
  sessionId: Math.floor(Math.random() * 100000000).toString(),
  text: "950",
};

const elements = {
  dialog: document.querySelector("#dialog"),
  dialogText: document.querySelector("#dialogText"),
  cancelButton: document.querySelector("#cancelButton"),
  dialogButton: document.querySelector("#dialogButton"),
  dialogInput: document.querySelector("#dialogInput"),
  phoneNumber: document.querySelector('[name="phone"]'),
  serviceCode: document.querySelector('input[name="code"]'),
  url: document.querySelector('[name="url"]'),
};

export async function sendRequest() {
  const params = new FormData();
  params.set("sessionId", state.sessionId);
  params.set("phoneNumber", elements.phoneNumber.value);
  params.set("serviceCode", elements.serviceCode.value);
  params.set("text", state.text);

  const response = await fetch(elements.url.value, {
    method: "POST",
    body: params,
  });
  const data = await response.text();

  if (response.headers.get("freeflow") == "FC") {
    showDialog(false, data);
  } else if (response.headers.get("freeflow") == "FB") {
    showDialog(true, data);
  } else {
    showDialog(true, "Invalid response from server");
  }
}
window.sendRequest = sendRequest;

function showDialog(stop, text) {
  elements.dialog.showModal();
  elements.dialogText.textContent = text;

  elements.dialogInput.style.display = stop ? "none" : "";
  elements.cancelButton.style.display = stop ? "none" : "";

  elements.dialogInput.value = "";
  elements.dialogInput.focus();
}

function hideDialog() {
  elements.dialog.close();
}

function proceed() {
  if (elements.dialogInput.value.trim() === "") return cancel();

  state.text += "*" + elements.dialogInput.value;
  void sendRequest();
}
window.proceed = proceed;

function cancel() {
  state.text = "950";
  hideDialog();
}

elements.dialog.addEventListener("close", cancel);
elements.cancelButton.addEventListener("click", cancel);
elements.dialogInput.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  proceed();
});
