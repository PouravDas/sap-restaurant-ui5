import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import Utils from "../model/Utils";
import { List$ItemClickEvent, List$SelectionChangeEvent } from "sap/ui/webc/main/List";
import Integer from "sap/ui/model/type/Integer";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";

type RestaurantsInfo = {
  value: [
    ID: String,
    name: String,
    description: String,
    averageCost: Integer,
    address: String
  ]
}

var selectedItemPath: string = null;
var delegateAdded = false;

export default class Restaurant extends BaseController {
  public onInit(): void {

    this.loadRestaurants();
    this.loadUser();
    this.setAllButtonsEnabled(false);

    if (!delegateAdded) {
      delegateAdded = true;
      this.getView().addEventDelegate({
        onBeforeShow: this.onInit.bind(this)
      });
    }
  }

  private async loadRestaurants() {
    const response = await fetch(Utils.BASE_URL + "/odata/v4/RestaurantService/Restaurants", {
      method: 'GET',
      headers: Utils.getHeaderWithToken()
    });
    const data = await response.json() as RestaurantsInfo;
    const model = new JSONModel();
    model.setData(data);
    this.setModel(model, "restaurants");
  }

  public onPress(oEvent: List$ItemClickEvent): void {
    const source = oEvent.getSource() as any;
    const path = source.getBindingContextPath();
    const item = source.getModel("restaurants").getProperty(path);
    const id = item.ID;
    this.goToMenu(id);
  }

  private goToMenu(id: string): void {
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("menu", {
      restaurantId: id
    }, true);
  }

  public onGoToMenuPress(): void {
    const item = this.getModel("restaurants").getProperty(selectedItemPath);
    const id = item.ID;
    this.goToMenu(id);
  }

  public onAddPress(): void {
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("restaurantAdd", {}, true);
  }

  public onEditPress(): void {
    const item = this.getModel("restaurants").getProperty(selectedItemPath);
    const id = item.ID;
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("restaurantEdit", { restaurantId: id }, true);
  }

  public onSelect(oEvent: List$SelectionChangeEvent): void {
    const source = oEvent.getSource() as any;
    const item = source.getSelectedItem();
    selectedItemPath = item.getBindingContextPath();

    this.setAllButtonsEnabled(true);
  }

  private setAllButtonsEnabled(enable: boolean): void {
    const buttonEdit = this.byId("buttonEdit") as Button;
    buttonEdit.setEnabled(enable);

    const buttonDelete = this.byId("buttonDelete") as Button;
    buttonDelete.setEnabled(enable);

    const buttonMenu = this.byId("buttonMenu") as Button;
    buttonMenu.setEnabled(enable);
  }

  public onDeletePress(): void {
    if (this.byId("DeleteDialog")) {
      (this.byId("DeleteDialog") as Dialog).open();
      return;
    }
    // create dialog lazily
    const frag = this.loadFragment({
      name: "com.sap.demoapp.view.DeleteConfirm",
      addToDependents: false
    }).then(() => { (this.byId("DeleteDialog") as Dialog).open(); });
  }

  public onCloseDialog(): void {
    (this.byId("DeleteDialog") as Dialog).close();
  }

  public onConfirmDialog(): void {
    const item = this.getModel("restaurants").getProperty(selectedItemPath);
    const id = item.ID;
    this.deleteRestaurant(id);
    this.onCloseDialog();
  }

  private async deleteRestaurant(restaurantID: string) {
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/Restaurants(${restaurantID})`, {
      method: 'DELETE',
      headers: Utils.getHeaderWithToken()
    });
    if (!response.ok) {
      MessageBox.show("Could not delet data!");
    } else {
      MessageToast.show("Restaurant deleted");
      setTimeout(() => {
        this.onInit();
      }, 250);
    }
  }
}