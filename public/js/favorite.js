const postFavorite = btn => {
  const prodId = btn.parentNode.querySelector("[name=artworkId").value;
  const csrf = btn.parentNode.querySelector("[name=_csrf]").value;

  if (
    btn.children[0].style.color === "" ||
    btn.children[0].style.color === "white"
  ) {
    btn.children[0].style.color = "#ef9a9a";
  } else {
    btn.children[0].style.color = "white";
  }

  fetch("/admin/favorite/" + prodId, {
    method: "POST",
    headers: {
      "csrf-token": csrf
    }
  })
    .then(result => {
      return result.json();
    })
    .then(data => {
      console.log(data);
      if (data.message === "Added") {
        M.toast({ html: "Added to favorites.", displayLength: 1500 });
      } else if (data.message === "Deleted") {
        M.toast({ html: "Deleted from favorites.", displayLength: 1500 });
      }
    })
    .catch(err => {
      console.log(err);
    });
};
