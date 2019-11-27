const deleteMessage = btn => {
  const messageId = btn.parentNode.querySelector("[name=messageId]").value;
  const csrf = btn.parentNode.querySelector("[name=_csrf]").value;

  const productElement = btn.closest("article");

  fetch("/admin/user/messages/delete/" + messageId, {
    method: "DELETE",
    headers: {
      "csrf-token": csrf
    }
  })
    .then(result => {
      return result.json();
    })
    .then(data => {
      console.log(data);
      productElement.parentNode.removeChild(productElement);
    })
    .catch(err => {
      console.log(err);
    });
};
