import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgZone } from '@angular/core';
import firebase from 'firebase';

declare var google;
//declare var placeSearch;

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

  GoogleAutocomplete: any;
  autocomplete: any;
  autocompleteItems: any;

  startDate = new Date().toISOString().substr(0, 10);
  endDate = new Date().toISOString().substr(0, 10);
  startTime = new Date().toISOString().substr(11, 5);
  endTime = new Date().toISOString().substr(11, 5);

  constructor(public navCtrl: NavController, private formBuilder: FormBuilder, private zone: NgZone) {
    this.eventForm = this.formBuilder.group({
      pickEventStartDate: ['', Validators.required],
      pickEventEndDate: ['', Validators.required],
      pickEventStartTime: ['', Validators.required],
      pickEventEndTime: ['', Validators.required],
      address: ['', Validators.required],
      proximity: ['', Validators.compose([Validators.required, Validators.pattern('^[0-9]*$')])],
    }, { validator: this.dateLessThan("pickEventStartDate", "pickEventEndDate", "pickEventStartTime", "pickEventEndTime") });
    
    this.GoogleAutocomplete = new google.maps.places.AutocompleteService();
    this.autocomplete = { input: '' };
    this.autocompleteItems = [];
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

  updateSearchResults() {
    if (this.autocomplete.input == '') {
      this.autocompleteItems = [];
      return;
    }
    this.GoogleAutocomplete.getPlacePredictions({ input: this.autocomplete.input },
      (predictions, status) => {
        this.autocompleteItems = [];
        this.zone.run(() => {
          predictions.forEach((prediction) => {
            this.autocompleteItems.push(prediction);
          });
        });
      });
  }

  selectSearchResult(item){
    this.autocompleteItems = [];
    this.autocomplete.input = item.description;
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
