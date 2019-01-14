import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import firebase from 'firebase';

declare var placeSearch;
//test
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  private eventForm: FormGroup;

  location = {
    lat: null,
    lng: null,
    name: null,
  };

  startDate = new Date().toISOString().substr(0, 10);
  endDate = new Date().toISOString().substr(0, 10);
  startTime = new Date().toISOString().substr(11, 5);
  endTime = new Date().toISOString().substr(11, 5);

  constructor(public navCtrl: NavController, private formBuilder: FormBuilder) {
    this.eventForm = this.formBuilder.group({
      pickEventStartDate: ['', Validators.required],
      pickEventEndDate: ['', Validators.required],
      pickEventStartTime: ['', Validators.required],
      pickEventEndTime: ['', Validators.required],
      address: ['', Validators.required],
      proximity: ['', Validators.compose([Validators.required, Validators.pattern('^[0-9]*$')])],
    }, { validator: this.dateLessThan("pickEventStartDate", "pickEventEndDate", "pickEventStartTime", "pickEventEndTime") });
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

  ionViewDidLoad() {
    //MapQuest PlaceSearch API
    let ps = placeSearch({
      key: 'TAal4gqFwLARLZi5EtdG5oBfs8D69Tyq',
      container: document.querySelector('#place-search-input'),
      //default: false
    });

    ps.on('change', (e) => {
      console.log(e);
      this.location.name = e.result.name;
      this.location.lat = e.result.latlng.lat;
      this.location.lng = e.result.latlng.lng;
    })
  }

  create() {
    firebase.database().ref('event/').push().set({
      latitude: this.location.lat,
      longitude: this.location.lng,
      name: this.location.name,
      proximity: this.eventForm.value.proximity,
      startDate: this.eventForm.value.pickEventStartDate,
      endDate: this.eventForm.value.pickEventEndDate,
      startTime: this.eventForm.value.pickEventStartTime,
      endTime: this.eventForm.value.pickEventEndTime,
    });
  }
}
