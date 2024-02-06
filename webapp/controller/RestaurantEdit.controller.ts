import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import Utils from "../model/Utils";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";

type RestaurantsInfo = {
  name: string,
  description: string,
  averageCost: number,
  address: string
}

type DisplayInfo = {
  title: string,
  saveButton: string,
  editMode: boolean,
  restaurantID: string
}

type Validation = {
  name: StateText,
  description: StateText,
  averageCost: StateText,
  address: StateText
}

type StateText = {
  state: string, text: string
}

var delegateAdded = false;

export default class Restaurant extends BaseController {
  public onInit(): void {
    const model = new JSONModel();
    this.setModel(model, "restaurant");

    const url = window.location.href;
    const displayInfo = {} as DisplayInfo;
    const restaurantEdit = "/restaurantEdit/";
    if (url.includes(restaurantEdit)) {
      const key = url.substring(url.indexOf(restaurantEdit) + restaurantEdit.length);
      displayInfo.editMode = true;
      displayInfo.title = "Edit Restaurant";
      displayInfo.saveButton = "Save"
      displayInfo.restaurantID = key;
      const displayModel = new JSONModel();
      displayModel.setData(displayInfo);
      this.setModel(displayModel, "displayInfo");
      this.loadRestaurants(key);
    }
    else {
      model.setData({} as RestaurantsInfo);
      displayInfo.editMode = false;
      displayInfo.title = "Add Restaurant";
      displayInfo.saveButton = "Add"
      const displayModel = new JSONModel();
      displayModel.setData(displayInfo);
      this.setModel(displayModel, "displayInfo");
    }
    const val = {
      name: { state: "None", text: "" },
      description: { state: "None", text: "" },
      averageCost: { state: "None", text: "" },
      address: { state: "None", text: "" }
    } as Validation;
    this.setModel(new JSONModel(val), "validate");

    if (!delegateAdded) {
      delegateAdded = true;
      this.getView().addEventDelegate({
        onBeforeShow: this.onInit.bind(this)
      });
    }
  }

  private async addRestaurant() {
    const data = (this.getModel("restaurant") as JSONModel).getData() as RestaurantsInfo;
    if (data.averageCost) {
      data.averageCost = Number(data.averageCost);
    }
    if (!this.validate(data)) {
      MessageToast.show("Input validation error");
      return;
    }
    const response = await fetch(Utils.BASE_URL + "/odata/v4/RestaurantService/Restaurants", {
      method: 'POST',
      headers: Utils.getHeaderWithToken(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      MessageBox.show("Could not save data!");
    } else {
      MessageToast.show("Restaurant added");
      setTimeout(() => {
        this.onNavBack();
      }, 1250);
    }
  }

  private async editRestaurant(restaurantID: string) {
    const data = (this.getModel("restaurant") as JSONModel).getData() as RestaurantsInfo;
    if (data.averageCost) {
      data.averageCost = Number(data.averageCost);
    }
    if (!this.validate(data)) {
      MessageToast.show("Input validation error");
      return;
    }
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/Restaurants(${restaurantID})`, {
      method: 'PATCH',
      headers: Utils.getHeaderWithToken(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      MessageBox.show("Could not save data!");
    } else {
      MessageToast.show("Restaurant saved");
      setTimeout(() => {
        this.onNavBack();
      }, 1250);
    }
  }

  private async loadRestaurants(restaurantID: string) {
    const response = await fetch(Utils.BASE_URL + `/odata/v4/RestaurantService/Restaurants(${restaurantID})`, {
      method: 'GET',
      headers: Utils.getHeaderWithToken()
    });
    const data = await response.json() as RestaurantsInfo;
    (this.getModel("restaurant") as JSONModel).setData(data);
  }

  public onSavePress(): void {
    const displayInfo = (this.getModel("displayInfo") as JSONModel).getData() as DisplayInfo;
    if (displayInfo.editMode) {
      this.editRestaurant(displayInfo.restaurantID);
    } else {
      this.addRestaurant();
    }
  }

  public onNavBack(): void {
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("restaurant", {}, true);
  }

  private validate(data: RestaurantsInfo): boolean {
    const val = (this.getModel("validate") as JSONModel).getData() as Validation;
    val.address.state = "None";
    val.address.text = "";
    val.averageCost.state = "None";
    val.averageCost.text = "";
    val.description.state = "None";
    val.description.text = "";
    val.name.state = "None";
    val.name.text = "";
    let valid = true;
    if (data.averageCost == undefined || data.averageCost == 0) {
      val.averageCost.state = "Error";
      val.averageCost.text = "Please enter average cost";
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
    if (this.isEmpty(data.name)) {
      val.name.state = "Error";
      val.name.text = "Please enter name";
      valid = false;
    } else if (this.outOfRange(data.name)) {
      val.name.state = "Error";
      val.name.text = "Only 255 characters are allowed";
      valid = false;
    }
    this.setModel(new JSONModel(val), "validate");
    return valid;
  }
}
