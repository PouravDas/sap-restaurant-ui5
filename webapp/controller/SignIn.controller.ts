import MessageBox from "sap/m/MessageBox";
import BaseController from "./BaseController";
import Utils from "../model/Utils";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageToast from "sap/m/MessageToast";

export default class SignIn extends BaseController {

  public onInit(): void {

    const val = {
      name: { state: "None", text: "" },
      email: { state: "None", text: "" },
      password: { state: "None", text: "" },
      passwordRepeat: { state: "None", text: "" }
    } as Validation;
    this.setModel(new JSONModel(val), "validate");
    this.setModel(new JSONModel({}), "signin");
  }

  public onSignUp(): void {
    const data = (this.getModel("signin") as JSONModel).getData() as SignupInfo;
    if (!this.validate(data)) {
      MessageToast.show("Input validation error");
      return;
    }
    this.signIn(data.name, data.password, data.email);
  }

  private validate(data: SignupInfo): boolean {
    const val = (this.getModel("validate") as JSONModel).getData() as Validation;
    val.name.state = "None";
    val.name.text = "";
    val.email.state = "None";
    val.email.text = "";
    val.password.state = "None";
    val.password.text = "";
    val.passwordRepeat.state = "None";
    val.passwordRepeat.text = "";
    let valid = true;
    if (this.isEmpty(data.name)) {
      val.name.state = "Error";
      val.name.text = "Please enter name";
      valid = false;
    }
    if (this.isEmpty(data.email)) {
      val.email.state = "Error";
      val.email.text = "Please enter email";
      valid = false;
    }
    if (this.isEmpty(data.password)) {
      val.password.state = "Error";
      val.password.text = "Please enter password";
      valid = false;
    }
    if (this.isEmpty(data.passwordRepeat)) {
      val.passwordRepeat.state = "Error";
      val.passwordRepeat.text = "Repeat the password";
      valid = false;
    }
    if (!this.isValidEmail(data.email)) {
      val.email.state = "Error";
      val.email.text = "Please enter a valid email";
      valid = false;
    }

    if (data.password !== data.passwordRepeat) {
      val.passwordRepeat.state = "Error";
      val.passwordRepeat.text = "The password did not match";
      valid = false;
    }
    this.setModel(new JSONModel(val), "validate");

    return valid;
  }

  private isValidEmail(sEmail: string) {
    var oEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return oEmailRegex.test(sEmail);
  }

  private async signIn(userID: string, password: string, email: string) {
    const body = { username: userID, password: password, email: email };
    const response = await fetch(Utils.BASE_URL + "/odata/v4/customapi/signup", {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json; charset=UTF-8' }
    });

    if (!response.ok) {
      if (response.status == 403) {
        MessageBox.show("Invalid password or user id");
      }
      if (response.status == 500) {
        MessageBox.show("Internal server error");
      }
      throw Error("unable to login");
    }

    MessageToast.show("User added. Redirecting to login page.");
    setTimeout(() => {
      this.goToLoginPage();
    }, 1250);
  }

  private goToLoginPage(): void {
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("login", {}, true);
  }

  public onNavBack() {
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("login", {}, true);
  }
}

type SignupInfo = {
  name: string,
  email: string,
  password: string,
  passwordRepeat: string
}

type Validation = {
  name: StateText,
  email: StateText,
  password: StateText,
  passwordRepeat: StateText
}

type StateText = {
  state: string, text: string
} 