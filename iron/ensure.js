export default function ensure (pred, msg) {
  if (!pred) {
    console.log(msg);
    throw new Error(msg);
  }
}
