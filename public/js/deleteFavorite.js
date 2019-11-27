const deleteFavorite = btn => {
  const productId = btn.parentNode.querySelector("[name=artworkId").value;
  const csrf = btn.parentNode.querySelector("[name=_csrf]").value;

  const productElement = btn.closest("article");
  console.log(productElement);

  fetch("/admin/user/favorites/delete/" + productId, {
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
