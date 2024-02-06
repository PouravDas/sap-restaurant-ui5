import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import Utils from "../model/Utils";
import { List$ItemClickEvent, List$SelectionChangeEvent } from "sap/ui/webc/main/List";
import List from "sap/m/List";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import MessageBox from "sap/m/MessageBox";
import { SearchField$SearchEvent } from "sap/m/SearchField";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Switch, { Switch$ChangeEvent } from "sap/m/Switch";

type MenuItem = {
  value: [
    ID: String,
    item: String,
    veg: boolean,
    category: String,
    description: String,
    price: float,
    restaurant_ID: String
  ]
}

var selectedItemPath: string = null;
var delegateAdded = false;

export default class Menu extends BaseController {
  public onInit(): void {
    this.loadMenu();
    this.loadUser();
    this.loadRestaurantName();
    this.setAllButtonEnable(false);

    if (!delegateAdded) {
      delegateAdded = true;
      this.getView().addEventDelegate({
        onBeforeShow: this.onInit.bind(this)
      });
    }
  }

  private async loadMenu() {
    const restaurant_ID = this.getRestaurantID();
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/MenuItems?$filter=restaurant_ID%20eq%20${restaurant_ID}`, {
      method: 'GET',
      headers: Utils.getHeaderWithToken()
    });
    const data = await response.json() as MenuItem;
    const model = new JSONModel();
    model.setData(data);
    this.setModel(model, "menu");
  }

  private async loadRestaurantName() {
    const restaurant_ID = this.getRestaurantID();
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/Restaurants?$filter=ID%20eq%20${restaurant_ID}`, {
      method: 'GET',
      headers: Utils.getHeaderWithToken()
    });
    const data = await response.json();
    const model = new JSONModel();
    model.setData({ restaurantName: data.value[0].name });
    this.setModel(model, "restaurant");
  }

  public onPress(oEvent: List$ItemClickEvent): void {
    const source = oEvent.getSource() as any;
    const path = source.getBindingContextPath();
    const item = source.getModel("menu").getProperty(path);

    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("addCart", { menuId: item.ID }, true);
  }

  public onNavBack() {
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("restaurant", {}, true);
  }

  public onAddPress() {
    const restaurant_ID = this.getRestaurantID();
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("menuAdd", { restaurantId: restaurant_ID }, true);
  }

  public onEditPress(): void {
    const item = this.getModel("menu").getProperty(selectedItemPath);
    const id = item.ID;
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("menuEdit", { menuId: id }, true);
  }

  private getRestaurantID(): string {
    const url = window.location.href.split('/');
    const restaurant_ID = url[url.length - 1];
    return restaurant_ID;
  }

  public onSelect(oEvent: List$SelectionChangeEvent): void {
    const source = oEvent.getSource() as any;
    const item = source.getSelectedItem();
    selectedItemPath = item.getBindingContextPath();
    this.setAllButtonEnable(true);
  }

  private setAllButtonEnable(enable: boolean): void {

    const buttonEdit = this.byId("buttonEdit") as Button;
    buttonEdit.setEnabled(enable);

    const buttonDelete = this.byId("buttonDelete") as Button;
    buttonDelete.setEnabled(enable);
  }

  public onDeletePress(): void {
    if (this.byId("DeleteDialog")) {
      (this.byId("DeleteDialog") as Dialog).open();
      return;
    }

    // create dialog lazily
    this.loadFragment({
      name: "com.sap.demoapp.view.DeleteConfirm",
      addToDependents: false
    }).then(() => { (this.byId("DeleteDialog") as Dialog).open(); });
  }


  public onCloseDialog(): void {
    (this.byId("DeleteDialog") as Dialog).close();
  }

  public onConfirmDialog(): void {
    const item = this.getModel("menu").getProperty(selectedItemPath);
    const id = item.ID;
    this.deleteMenu(id);
    this.onCloseDialog();
  }

  private async deleteMenu(menuID: string) {
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/MenuItems(${menuID})`, {
      method: 'DELETE',
      headers: Utils.getHeaderWithToken()
    });
    if (!response.ok) {
      MessageBox.show("Could not delet data!");
    } else {
      MessageBox.show("Menu item deleted");
      this.onInit();
    }
  }

  public onFilterMenu(oEvent: SearchField$SearchEvent) {
    const aFilter = [];
    const sQuery = oEvent.getParameter("query");
    if (sQuery) {
      aFilter.push(new Filter("item", FilterOperator.Contains, sQuery));
    }

    const vegOnly = this.byId("vegOnly") as Switch;
    const vegOnlyState = vegOnly.getState();
    if (vegOnlyState) {
      aFilter.push(new Filter("veg", FilterOperator.EQ, true));
    }

    // filter binding
    const oList = this.byId("menuList") as List;
    const oBinding = oList.getBinding("items") as any;
    oBinding.filter(aFilter);
  }

  public onVegOnly(event: Switch$ChangeEvent) {
    const state = event.getParameter("state");
    let aFilter = [];
    if (state)
      aFilter.push(new Filter("veg", FilterOperator.EQ, true));
    else {
      aFilter = null;
    }

    // filter binding
    const oList = this.byId("menuList") as List;
    const oBinding = oList.getBinding("items") as any;
    oBinding.filter(aFilter);
  }

  public statusTextFormatter(veg: boolean) {
    if (veg) {
      return 'Success';
    } else {
      return "Error";
    }
  }

  onBeforeRendering(): void {
    console.log("onBeforeRendering");
  }
}