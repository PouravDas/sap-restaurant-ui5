
import Storage from "sap/ui/util/Storage";

export default class Utils {
  public static readonly BASE_URL: string = "http://localhost:8081";

  public static getHeaderWithToken(): Record<string, string> {
    const token = this.getToken();
    if (token == undefined || token.length == 0) {
      throw new Error("auth token missing");
    }
    const header = {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': `Bearer ${token}`
    };
    return header;
  }

  public static storeToken(token: string): void {
    const store = new Storage(Storage.Type.session, "token");
    store.put("auth", token);
  }

  public static getToken(): string {
    const store = new Storage(Storage.Type.session, "token");
    return store.get("auth");
  }

  public static removeToken(): void {
    const store = new Storage(Storage.Type.session, "token");
    store.remove("auth");
  }
}