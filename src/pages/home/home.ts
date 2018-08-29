import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Events } from 'ionic-angular';
import { ToastController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  private eventForm: FormGroup;
  private eventDuration = false;

  constructor(public navCtrl: NavController, public events: Events, private formBuilder: FormBuilder, private toastCtrl: ToastController) {
    //console.log('const')
    this.eventForm = this.formBuilder.group({
      pickEventStartDate: ['', Validators.required],
      pickEventEndDate: ['', Validators.required],
      pickEventStartTime: ['', Validators.required],
      pickEventFinishTime: ['', Validators.required],
      address: ['', Validators.required],
      proximity: ['', Validators.required],
    }, { validator: this.dateLessThan("pickEventStartDate", "pickEventEndDate", "pickEventStartTime", "pickEventFinishTime") });

    events.subscribe('event:created', (eventDuration, time) => {
      // user and time are the same arguments passed in `events.publish(user, time)`
      console.log('Event is created:', eventDuration, 'at', new Date(time));
      this.presentToast('Event is created at '+ new Date(time))
    });
  }

  dateLessThan(startDate: string, endDate: string, startTime: string, finishTime: string) {
    return (group: FormGroup): { [key: string]: any } => {
      let sd = group.controls[startDate];
      let ed = group.controls[endDate];
      let st = group.controls[startTime];
      let ft = group.controls[finishTime];
      if (sd.value > ed.value) {
        return {
          dates: "Start Date should be equal or less than End Date"
        };
      }
      else if (sd.value === ed.value) {
        if (st.value > ft.value) {
          return {
            time: "Start Time should be equal or less than Finish Time"
          };
        }
      }
      return {};
    }
  }

  // ngOnInit(){
  //   console.log('init')
  // }

  create() {
    //console.log(this.pickEventStartDate, this.pickEventEndDate, this.pickEventStartTime, this.pickEventFinishTime, this.address, this.proximity);
    //console.log(this.eventForm.value)
    this.eventDuration = true;

    this.events.publish('event:created', this.eventDuration, Date.now());
  }

  presentToast(m) {
    let toast = this.toastCtrl.create({
      message: m,
      duration: 3000,
      position: 'top'
    });
  
    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });
  
    toast.present();
  }
}
