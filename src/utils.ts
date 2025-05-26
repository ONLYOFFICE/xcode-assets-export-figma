/**
 * Formats JSON with a space before the colon
 * @param obj Object to serialize to JSON
 * @returns JSON string with a space before the colon
 */
export function formatJsonWithSpaceBeforeColon(obj: any): string {
  // First convert the object to JSON with indentation
  const jsonString = JSON.stringify(obj, null, 2);
  
  // Replace all ":" with " :" (add a space before the colon)
  return jsonString.replace(/"([^"]+)":/g, '"$1" :');
}
