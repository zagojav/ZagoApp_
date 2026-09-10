// Safety net for the login/profile-load chain: a Promise that hangs forever
// (never resolves, never rejects — the exact failure mode seen when iOS
// Safari/WebKit silently blocks a storage API Firebase depends on) leaves
// nothing for a normal .catch() to react to. Racing it against a timer
// guarantees the caller's .then()/.catch() always fires eventually.
export function withTimeout<T>(promise: Promise<T>, ms: number, message = 'Tempo de conexão esgotado.'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}
