export function getItem (key) {
  const val = localStorage.getItem(key);
  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
}

export function setItem (key, val) {
  try {
    const str = typeof val === 'string' ? val : JSON.stringify(val);
    localStorage.setItem(key, str);
    return true;
  } catch (e) {
    return false;
  }
}
