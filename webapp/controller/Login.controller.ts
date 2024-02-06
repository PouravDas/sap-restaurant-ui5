import MessageBox from "sap/m/MessageBox";
import BaseController from "./BaseController";
import Input from "sap/m/Input";
import Utils from "../model/Utils";
import Storage from "sap/ui/util/Storage";

export default class Login extends BaseController {

  public onInit(): void {
    const passwordInput = this.byId("password") as Input;
    passwordInput.onsapenter = (e) => {
      this.onLogin();
    };
  }

  public onLogin(): void {
    const userId = this.byId("userID") as Input;
    const userVal = userId.getValue();
    const password = this.byId("password") as Input;
    const passwordValue = password.getValue();
    if (userVal == undefined || userVal.trim().length == 0) {
      MessageBox.show("User ID is required");
      return;
    }
    if (passwordValue == undefined || passwordValue.trim().length == 0) {
      MessageBox.show("Password is required");
      return;
    }
    this.getToken(userVal, passwordValue).then(() => {
      //MessageBox.show("Welcome");
      this.goToRestaurantPage();
    });
  }

  private async getToken(userID: String, password: String) {
    const response = await fetch(Utils.BASE_URL + `/odata/v4/customapi/generateToken(username='${userID}',password='${password}')`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' }
    });

    if (!response.ok) {
      if (response.status == 403) {
        MessageBox.show("Invalid password or user id");
      }
      if (response.status == 500) {
        if (response.body !== null) {
          const body = await response.json() as any;
          if (body?.error?.message) {
            MessageBox.show(body.error.message);
          } else
            MessageBox.show("Internal server error");
        } else
          MessageBox.show("Internal server error");
      }
    }

    if (response.body !== null) {
      const data = await response.json();
      const store = new Storage(Storage.Type.session, "token");
      store.put("auth", data.value);
    }
  }

  public onSignup() {
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("signin", {}, true);
  }
  private goToRestaurantPage(): void {
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("restaurant", {}, true);
  }
}