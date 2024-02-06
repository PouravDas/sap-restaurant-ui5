import JSONModel from "sap/ui/model/json/JSONModel";
import Utils from "../model/Utils";
import BaseController from "./BaseController";

type ProfileInfo = {
  ID: string,
  name: string,
  email: string,
  role: string
}

var delegateAdded = false;

export default class Profile extends BaseController {

  onInit(): void {
    this.loadUser().then(() => this.loadUserProfile());

    if (!delegateAdded) {
      delegateAdded = true;
      this.getView().addEventDelegate({
        onBeforeShow: this.onInit.bind(this)
      });
    }
  }

  private async loadUserProfile() {
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/Users?$filter=name%20eq%20%27${this.userName}%27`, {
      method: 'GET',
      headers: Utils.getHeaderWithToken()
    });
    const data = await response.json() as any;
    const model = new JSONModel();
    model.setData(data.value[0] as ProfileInfo);
    this.setModel(model, "profile");
  }

  public onLogoutProfile(): void {
    Utils.removeToken();
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("login", {}, true);
  }
}