const descriptionForm = document.getElementById("profile__description__form");
const toggleButton = document.getElementById("toggleDesc__button");
const descText = document.getElementById("description__text");

toggleDescription = () => {
  descriptionForm.style.display = "block";
  toggleButton.style.display = "none";
};
