import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import AppComponent from "../Component";
import Model from "sap/ui/model/Model";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import Router from "sap/ui/core/routing/Router";
import History from "sap/ui/core/routing/History";
import Utils from "../model/Utils";
import JSONModel from "sap/ui/model/json/JSONModel";
import Dialog from "sap/m/Dialog";

/**
 * @namespace com.sap.demoapp.controller
 */
export default abstract class BaseController extends Controller {
  userName: String;
  /**
   * Convenience method for accessing the component of the controller's view.
   * @returns The component of the controller's view
   */
  public getOwnerComponent(): AppComponent {
    return super.getOwnerComponent() as AppComponent;
  }

  /**
   * Convenience method to get the components' router instance.
   * @returns The router instance
   */
  public getRouter(): Router {
    return UIComponent.getRouterFor(this);
  }

  /**
   * Convenience method for getting the i18n resource bundle of the component.
   * @returns The i18n resource bundle of the component
   */
  public getResourceBundle(): ResourceBundle | Promise<ResourceBundle> {
    const oModel = this.getOwnerComponent().getModel("i18n") as ResourceModel;
    return oModel.getResourceBundle();
  }

  /**
   * Convenience method for getting the view model by name in every controller of the application.
   * @param [sName] The model name
   * @returns The model instance
   */
  public getModel(sName?: string): Model {
    return this.getView().getModel(sName);
  }

  /**
   * Convenience method for setting the view model in every controller of the application.
   * @param oModel The model instance
   * @param [sName] The model name
   * @returns The current base controller instance
   */
  public setModel(oModel: Model, sName?: string): BaseController {
    this.getView().setModel(oModel, sName);
    return this;
  }

  /**
   * Convenience method for triggering the navigation to a specific target.
   * @public
   * @param sName Target name
   * @param [oParameters] Navigation parameters
   * @param [bReplace] Defines if the hash should be replaced (no browser history entry) or set (browser history entry)
   */
  public navTo(sName: string, oParameters?: object, bReplace?: boolean): void {
    this.getRouter().navTo(sName, oParameters, undefined, bReplace);
  }

  /**
   * Convenience event handler for navigating back.
   * It there is a history entry we go one step back in the browser history
   * If not, it will replace the current entry of the browser history with the main route.
   */
  public onNavBack(): void {
    const sPreviousHash = History.getInstance().getPreviousHash();
    if (sPreviousHash !== undefined) {
      window.history.go(-1);
    } else {
      this.getRouter().navTo("restaurant", {}, undefined, true);
    }
  }


  /**
   * Common Methods
   */

  protected async loadUser() {
    const response = await fetch(Utils.BASE_URL + "/odata/v4/customapi/currentUser()", {
      method: 'GET',
      headers: Utils.getHeaderWithToken()
    });
    const body = await response.json() as any;
    const data = JSON.parse(body.value) as UserInfo;

    const model = new JSONModel();
    model.setData({ editMode: data.role == 'ADMIN' });
    this.userName = data.user;
    this.setModel(model, "display");
  }

  /**
   * Profile
   */
  public onProfilePress(): void {
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("profile", {}, true);
  }


  public onCartPress(): void {
    const oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("cart", {}, true);
  }

  protected isEmpty(input: string): boolean {
    return input == undefined || input === "";
  }

  protected outOfRange(input: string): boolean {
    return input.length > 255;
  }
}

type UserInfo = {
  user: string,
  role: string
}
