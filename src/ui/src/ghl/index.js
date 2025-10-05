/* The above class is a JavaScript GHL helper class that retrieves user data by sending a request to a server and
decrypting the response using a key. */
export class GHL {
  appId;

  constructor() {}

  async getUserData() {
    if (window === window.parent) {
      console.info('Running in standalone mode - GHL SDK not available');
      return null;
    }

    const key = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(null);
      }, 1000);
      
      const messageHandler = ({ data }) => {
        if (data.message === "REQUEST_USER_DATA_RESPONSE") {
          clearTimeout(timeout);
          window.removeEventListener("message", messageHandler);
          resolve(data.payload);
        }
      };

      window.addEventListener("message", messageHandler);
      window.parent.postMessage({ message: "REQUEST_USER_DATA" }, "*");
    });

    if (!key) {
      return null;
    }

    try {
      const res = await fetch('/decrypt-sso', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({key})
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Failed to decrypt SSO:', error);
      return null;
    }
  }
}
