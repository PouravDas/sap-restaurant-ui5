import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import Utils from "../model/Utils";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";

var restaurant_ID: string = null;
var userUUID: string = null;
var delegateAdded = false;

export default class AddCart extends BaseController {

  public onInit(): void {

    this.loadUser()
      .then(() => this.loadUserUUID())
      .then(() => this.loadMenu(this.getMenuID()))
      .then(() => this.loadRestaurantName(restaurant_ID));

    if (!delegateAdded) {
      delegateAdded = true;
      this.getView().addEventDelegate({
        onBeforeShow: this.onInit.bind(this)
      });
    }
  }

  private getMenuID(): string {
    const url = window.location.href.split('/');
    return url[url.length - 1];
  }

  private async loadMenu(menuId: string) {
    let response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/MenuItems?$filter=ID%20eq%20${menuId}`, {
      method: 'GET',
      headers: Utils.getHeaderWithToken()
    });
    let data = await response.json() as any;
    restaurant_ID = data.value[0].restaurant_ID;
    const model = new JSONModel();
    model.setData(data.value[0]);
    this.setModel(model, "menu");

    //for update case
    response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/Carts?$filter=user_ID%20eq%20${userUUID}%20and%20item_ID%20eq%20${menuId}`, {
      method: 'GET',
      headers: Utils.getHeaderWithToken()
    });
    data = await response.json() as any;
    const modelQty = new JSONModel();
    const displayInfo = {} as DisplayInfo;
    if (data.value.length > 0) {
      //update
      modelQty.setData({ quantity: data.value[0].quantity });
      displayInfo.editMode = true;
      displayInfo.saveButton = "Update";
      displayInfo.cartID = data.value[0].ID;
    } else {
      //add
      modelQty.setData({ quantity: 1 });
      displayInfo.editMode = false;
      displayInfo.saveButton = "Add";
    }
    this.setModel(modelQty, "quantity");
    this.setModel(new JSONModel(displayInfo), "displayInfo");
  }

  private async loadRestaurantName(restaurant_ID: string) {
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/Restaurants?$filter=ID%20eq%20${restaurant_ID}`, {
      method: 'GET',
      headers: Utils.getHeaderWithToken()
    });
    const data = await response.json();
    const model = new JSONModel();
    model.setData({ restaurantName: data.value[0].name });
    this.setModel(model, "restaurant");
  }

  public onSave() {
    var cart = {} as Cart;
    cart.item_ID = this.getMenuID();
    cart.user_ID = userUUID;
    cart.quantity = (this.getModel("quantity") as JSONModel).getData().quantity;
    const displayInfo = ((this.getModel("displayInfo") as JSONModel).getData() as DisplayInfo);
    if (displayInfo.editMode) {
      // update
      this.editCart(displayInfo.cartID, cart);
    } else {
      //add
      this.addToCart(cart);
    }
  }

  public onRemoveCart() {
    this.deleteCart(((this.getModel("displayInfo") as JSONModel).getData() as DisplayInfo).cartID);
  }

  private async addToCart(cart: Cart) {
    const response = await fetch(Utils.BASE_URL + "/odata/v4/RestaurantService/Carts", {
      method: 'POST',
      headers: Utils.getHeaderWithToken(),
      body: JSON.stringify(cart)
    });
    if (!response.ok) {
      if (response.status == 409) {
        MessageBox.show("Item alredy added in cart");
      } else {
        MessageBox.show("Could not save data!");
      }
    } else {
      MessageToast.show("Item added to cart");
      setTimeout(() => {
        this.onNavBack();
      }, 1250);
    }
  }

  private async editCart(cartID: string, cart: Cart) {
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/Carts(${cartID})`, {
      method: 'PATCH',
      headers: Utils.getHeaderWithToken(),
      body: JSON.stringify(cart)
    });
    if (!response.ok) {
      MessageBox.show("Could not save data!");
    } else {
      MessageToast.show("Cart updated!");
      setTimeout(() => {
        this.onNavBack();
      }, 1250);
    }
  }

  private async deleteCart(cartID: string) {
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/Carts(${cartID})`, {
      method: 'DELETE',
      headers: Utils.getHeaderWithToken()
    });
    if (!response.ok) {
      MessageBox.show("Could not delet data!");
    } else {
      MessageToast.show("Item removed from the cart!");
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

  public onNavBack() {
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("menu", { restaurantId: restaurant_ID }, true);
  }
}

type Cart = {
  user_ID: string,
  item_ID: string,
  quantity: number
}

type DisplayInfo = {
  saveButton: string,
  editMode: boolean,
  cartID: string
}