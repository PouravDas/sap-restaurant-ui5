import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import Utils from "../model/Utils";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import { List$ItemClickEvent } from "sap/ui/webc/main/List";

var restaurant_ID: string = null;
var userUUID: string = null;

var delegateAdded = false;

export default class Cart extends BaseController {

  public onInit(): void {
    this.loadUser().then(() => this.loadUserUUID()).then(() => this.loadCarts());

    if (!delegateAdded) {
      delegateAdded = true;
      this.getView().addEventDelegate({
        onBeforeShow: this.onInit.bind(this)
      });
    }
  }


  public onAddToCart() {
    var cart = {} as CartInf;
    //cart.item_ID = this.getMenuID();
    cart.user_ID = userUUID;
    cart.quantity = (this.getModel("quantity") as JSONModel).getData().quantity;
    this.addToCart(cart);
  }

  private async addToCart(cart: CartInf) {
    const response = await fetch(Utils.BASE_URL + "/odata/v4/RestaurantService/Carts", {
      method: 'POST',
      headers: Utils.getHeaderWithToken(),
      body: JSON.stringify(cart)
    });
    if (!response.ok) {
      MessageBox.show("Could not save data!");
    } else {
      MessageToast.show("Item added to cart");
      setTimeout(() => {
        this.onNavBack();
      }, 1250);
    }
  }

  private async loadUserUUID() {
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/Users?$filter=name%20eq%20%27${this.userName}%27`, {
      method: 'GET',
      headers: Utils.getHeaderWithToken()
    });
    const data = await response.json() as any;
    userUUID = data.value[0].ID;
  }

  private async loadCarts() {
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/Carts?$expand=item&filter=user_ID%20eq%20%27${userUUID}`, {
      method: 'GET',
      headers: Utils.getHeaderWithToken()
    });
    const data = await response.json() as CartDetails;
    const model = new JSONModel();
    model.setData(data);
    this.setModel(model, "cartDetails");
    this.findTotal(data);
  }

  findTotal(data: CartDetails) {
    let sum: int = 0;
    data.value.forEach(c => {
      const _c = c as any;
      sum += (_c.quantity * _c.item.price) as int;
    });
    const model = new JSONModel();
    model.setData({ sum: sum });
    this.setModel(model, "totalSum");
  }

  public onNavBack() {
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("restaurant", {}, true);
  }

  public onPress(oEvent: List$ItemClickEvent): void {
    const source = oEvent.getSource() as any;
    const path = source.getBindingContextPath();
    const item = source.getModel("cartDetails").getProperty(path);

    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("addCart", { menuId: "fromcart=true&itemID=" + item.item_ID }, true);
  }
}

type CartInf = {
  user_ID: string,
  item_ID: string,
  quantity: number
}

type CartDetails = {
  value: [
    quantity: number,
    item: {
      item: string,
      description: string,
      price: number
    }
  ]
}