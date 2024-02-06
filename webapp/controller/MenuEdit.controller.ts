import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import Utils from "../model/Utils";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";

type MenuInfo = {
  item: string,
  description: string,
  category: string,
  price: number,
  veg: boolean,
  restaurant_ID: string
}

type DisplayInfo = {
  saveButton: string,
  editMode: boolean,
  menuID: string
}

type Validation = {
  item: StateText,
  description: StateText,
  category: StateText,
  price: StateText,
  veg: StateText
}

type StateText = {
  state: string, text: string
}

var delegateAdded = false;

export default class MenuEdit extends BaseController {
  public onInit(): void {
    const url = window.location.href;
    const displayInfo = {} as DisplayInfo;
    const menuEdit = "/menuEdit/";
    const menuAdd = "/menuAdd/";
    if (url.includes(menuEdit)) {
      const menuID = url.substring(url.indexOf(menuEdit) + menuEdit.length);
      displayInfo.saveButton = "Save"
      displayInfo.menuID = menuID;
      displayInfo.editMode = true;
      const displayModel = new JSONModel();
      displayModel.setData(displayInfo);
      this.setModel(displayModel, "displayInfo");
      this.loadMenu(menuID).then(() => {
        const restaurantId = ((this.getModel("menu") as JSONModel).getData() as MenuInfo).restaurant_ID;
        this.fetchCategories(restaurantId);
        this.loadRestaurantName(restaurantId);
      });
    }
    else if (url.includes(menuAdd)) {
      const restaurantID = url.substring(url.indexOf(menuAdd) + menuAdd.length);
      displayInfo.saveButton = "Add"
      displayInfo.editMode = false;
      const displayModel = new JSONModel();
      displayModel.setData(displayInfo);
      this.setModel(displayModel, "displayInfo");

      const menuData = {} as MenuInfo;
      menuData.restaurant_ID = restaurantID;
      const model = new JSONModel();
      model.setData(menuData);
      this.setModel(model, "menu");
      this.fetchCategories(restaurantID);
      this.loadRestaurantName(restaurantID);
    }
    const val = {
      item: { state: "None", text: "" },
      description: { state: "None", text: "" },
      category: { state: "None", text: "" },
      price: { state: "None", text: "" }
    } as Validation;
    this.setModel(new JSONModel(val), "validate");

    if (!delegateAdded) {
      delegateAdded = true;
      this.getView().addEventDelegate({
        onBeforeShow: this.onInit.bind(this)
      });
    }
  }

  private async loadRestaurantName(restaurantID: string) {
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/Restaurants?$filter=ID%20eq%20${restaurantID}`, {
      method: 'GET',
      headers: Utils.getHeaderWithToken()
    });
    const data = await response.json();
    const model = new JSONModel();
    model.setData({ restaurantName: data.value[0].name });
    this.setModel(model, "restaurant");
  }

  private async addMenu() {
    const data = (this.getModel("menu") as JSONModel).getData() as MenuInfo;
    if (data.price) {
      data.price = Number(data.price);
    }
    const response = await fetch(Utils.BASE_URL + "/odata/v4/RestaurantService/MenuItems", {
      method: 'POST',
      headers: Utils.getHeaderWithToken(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      MessageBox.show("Could not save data!");
    } else {
      MessageToast.show("Menu item added");
      setTimeout(() => {
        this.onNavBack();
      }, 1250);
    }
  }

  private async editMenu(menuID: string) {
    const data = (this.getModel("menu") as JSONModel).getData() as MenuInfo;
    if (data.price) {
      data.price = Number(data.price);
    }
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/MenuItems(${menuID})`, {
      method: 'PATCH',
      headers: Utils.getHeaderWithToken(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      MessageBox.show("Could not save data!");
    } else {
      MessageToast.show("Menu item saved");
      setTimeout(() => {
        this.onNavBack();
      }, 1250);
    }
  }

  private async loadMenu(meuID: string) {
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/MenuItems(${meuID})`, {
      method: 'GET',
      headers: Utils.getHeaderWithToken()
    });
    const data = await response.json() as MenuInfo;
    const model = new JSONModel();
    model.setData(data);
    this.setModel(model, "menu");
  }

  public onSavePress(): void {
    const displayInfo = (this.getModel("displayInfo") as JSONModel).getData() as DisplayInfo;
    const data = (this.getModel("menu") as JSONModel).getData() as MenuInfo;
    if (!this.validate(data)) {
      MessageToast.show("Input validation error");
      return;
    }
    if (displayInfo.editMode) {
      this.editMenu(displayInfo.menuID);
    } else {
      this.addMenu();
    }
  }

  public onNavBack(): void {
    const restaurant_ID = ((this.getModel("menu") as JSONModel).getData() as MenuInfo).restaurant_ID;
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("menu", { restaurantId: restaurant_ID }, true);
  }

  //fetch all categories
  private async fetchCategories(restaurantId: string) {
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/MenuItems?$filter=restaurant_ID%20eq%20${restaurantId}&$select=category`, {
      method: 'GET',
      headers: Utils.getHeaderWithToken()
    });
    const data = await response.json();
    const categoriesSet = new Set();

    data.value.forEach((e: { category: string; }) => {
      categoriesSet.add(e.category);
    });

    const categoriesArr: { category: string; }[] = [];

    categoriesSet.forEach(c => {
      categoriesArr.push({ category: c as string });
    });

    const model = new JSONModel();
    model.setData({ categories: categoriesArr });
    this.setModel(model, "categories");
  }

  private validate(data: MenuInfo): boolean {
    const val = (this.getModel("validate") as JSONModel).getData() as Validation;
    val.item.state = "None";
    val.item.text = "";
    val.category.state = "None";
    val.category.text = "";
    val.description.state = "None";
    val.description.text = "";
    val.price.state = "None";
    val.price.text = "";
    let valid = true;
    if (this.isEmpty(data.item)) {
      val.item.state = "Error";
      val.item.text = "Please enter item";
      valid = false;
    } else if (this.outOfRange(data.item)) {
      val.item.state = "Error";
      val.item.text = "Only 255 characters are allowed";
      valid = false;
    }
    if (data.price == undefined || data.price == 0) {
      val.price.state = "Error";
      val.price.text = "Please enter price";
      valid = false;
    }
    if (this.isEmpty(data.description)) {
      val.description.state = "Error";
      val.description.text = "Please enter description";
      valid = false;
    } else if (this.outOfRange(data.description)) {
      val.description.state = "Error";
      val.description.text = "Only 255 characters are allowed";
      valid = false;
    }
    if (this.isEmpty(data.category)) {
      val.category.state = "Error";
      val.category.text = "Please enter name";
      valid = false;
    } else if (this.outOfRange(data.category)) {
      val.category.state = "Error";
      val.category.text = "Only 255 characters are allowed";
      valid = false;
    }
    this.setModel(new JSONModel(val), "validate");
    return valid;
  }
}
