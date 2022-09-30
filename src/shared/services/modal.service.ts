/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { alertController, toastController, modalController, actionSheetController} from "@ionic/vue";
import { ComponentRef, OverlayEventDetail } from '@ionic/core';
import { BUTTON_ROLE } from "../constants/common.const";

export class ModalService {
    private alertElement: HTMLIonAlertElement | undefined;
    private modalElement: HTMLIonModalElement | undefined;
    private modalElementList: HTMLIonModalElement[] = [];
    public async modalAlert({ header = '', message = '', subHeader ='',btnText = 'OK', cssClass = [''], callback = (_result: any) => { } }) {
        this.alertElement = await alertController.create({
            header: header,
            subHeader: subHeader,
            message: message,
            cssClass: cssClass,
            buttons: [{
                role: 'ok',
                text: btnText,
                handler(result) {
                    callback(result);
                },
            }],
        });
        await this.alertElement.present();
        const result = await this.alertElement.onWillDismiss();
        if (callback) {
            callback(result);
        }
        return result;
    }

    public async modalConfirm({ title = '', content = '', cssClass = [''],
        lBtn = {btnText: '', btnCss:'', callback: (res: any) => { }},
        rBtn = {btnText:'', callback: (res: any) => { }},
        callback = (res: any) => { } }) {
        const lBtnText = lBtn.btnText || 'No';
        const lBtnCssClass = lBtn.btnCss || 'secondary';
        const lBtnCallback = lBtn.callback || function () { };

        const rBtnText = rBtn.btnText || 'Yes';
        const rBtnCallback = rBtn.callback || function () { };

        this.alertElement = await alertController.create({
            cssClass: cssClass,
            header: title,
            message: content,
            buttons: [
                {
                    text: lBtnText,
                    role: 'cancel',
                    cssClass: lBtnCssClass,
                    handler: (res) => {
                        lBtnCallback(res);
                    }
                }, {
                    text: rBtnText,
                    role: 'confirm',
                    handler: (res) => {
                        rBtnCallback(res);
                    }
                }
            ]
        });
        await this.alertElement.present();
        const result = await this.alertElement.onWillDismiss();
        if (callback) {
            callback(result);
        }
        return result;
    }
    public async toastPresent(obj:{message: string, duration: number, color?: string, cssClass?: [string]}) {
        const toastDuration = obj.duration === 0 ? 2000 : obj.duration; 
        const conlor = obj.color === undefined ? 'primary' : obj.color;
        const cssClass = obj.cssClass !== undefined ? obj.cssClass : undefined;
        const toast  = await toastController.create({
            message: obj.message,
            duration: toastDuration,
            color: conlor,
            cssClass: cssClass            
        });
        toast.present();
    }

    public async modalOpenComponent(template: {component: ComponentRef, componentProps?: object, callback?:(result: OverlayEventDetail) => {}, cssClass?: string }) {
        this.modalElement = await modalController.create({
            component: template.component,
            componentProps: template.componentProps,
            cssClass: template.cssClass
        });
        await this.modalElement.present();
        this.modalElementList.push(this.modalElement);
        const result = await this.modalElement.onWillDismiss();
        if (template.callback) {
            template.callback(result);
          }
          return result;
    }

    public async dismissComponent(result: { role: BUTTON_ROLE, data?: any }){
        await modalController.dismiss(result.data, result.role);
        this.modalElementList.pop();
    }

    public async dismissAllComponent(result: { role: BUTTON_ROLE, data?: any }) {
        if (!result) {
            result = {} as any;
        }
        for (const m of this.modalElementList) {
            const data = { result: result.data, screenLength: this.modalElementList.length };
            await m.dismiss(data, result.role);
          }
          this.modalElementList = [];
    }
}