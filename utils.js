export function formatDate(timestamp) {
  const date = timestamp.toDate();
  return date.toLocaleString();
}

export function validateEmail(email) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}
