import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Events } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';

import firebase from 'firebase';

declare var google;
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  private eventForm: FormGroup;
  private eventDuration = false;

  map: any;
  mapElement: any;
  query: string = '';
  places: any = [];
  location = {
    id: null,
    lat: null,
    lng: null,
    name: null,
    description: null
  };
  autocompleteService: any;
  placesService: any;

  startDate = new Date().toISOString().substr(0,10);
  endDate = new Date().toISOString().substr(0,10);
  startTime = new Date().toISOString().substr(11,5); 
  endTime = new Date().toISOString().substr(11,5);

  constructor(public navCtrl: NavController, public events: Events, private formBuilder: FormBuilder,
    private toastCtrl: ToastController, private geolocation: Geolocation) {
      
    this.eventForm = this.formBuilder.group({
      pickEventStartDate: ['', Validators.required],
      pickEventEndDate: ['', Validators.required],
      pickEventStartTime: ['', Validators.required],
      pickEventEndTime: ['', Validators.required],
      address: ['', Validators.required],
      proximity: ['', Validators.compose([Validators.required, Validators.pattern('^[0-9]*$')])],
    }, { validator: this.dateLessThan("pickEventStartDate", "pickEventEndDate", "pickEventStartTime", "pickEventEndTime") });

    events.subscribe('event:created', (eventDuration, time) => {
      console.log('Event is created:', eventDuration, 'at', new Date(time));
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

  ionViewDidLoad() {
    this.geolocation.getCurrentPosition().then((position) => {
      let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

      let mapOptions = {
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }

      this.map = new google.maps.Map(document.getElementById("googleMap"), mapOptions);
    }).catch((error) => {
      console.log('Error getting location', error);
    });
  }

  create() {
    this.eventDuration = true;
    this.events.publish('event:created', this.eventDuration, Date.now());

    let watch = this.geolocation.watchPosition();
    watch.subscribe((data) => {
      // data can be a set of coordinates, or an error (if an error occurred).
      // console.log(data.coords.latitude)
      // console.log(data.coords.longitude)
    });
  
    //add event information to firebase
    firebase.database().ref('event/').push().set({
      id: this.location.id,
      latitude: this.location.lat,
      longitude: this.location.lng,
      name : this.location.name,
      proximity: this.eventForm.value.proximity,
      startDate: this.eventForm.value.pickEventStartDate,
      endDate: this.eventForm.value.pickEventEndDate,
      startTime: this.eventForm.value.pickEventStartTime,
      endTime: this.eventForm.value.pickEventEndTime,
      description: this.location.description
    });

    this.events.publish('create');
  }

  // presentToast(m) {
  //   let toast = this.toastCtrl.create({
  //     message: m,
  //     duration: 10000,
  //     position: 'top'
  //   });

  //   toast.onDidDismiss(() => {
  //     console.log('Dismissed toast');
  //   });

  //   toast.present();
  // }

  searchPlace() {
    this.autocompleteService = new google.maps.places.AutocompleteService();

    if (this.query.length > 0) {
      let config = {
        types: ['geocode'],
        input: this.query
      }

      this.autocompleteService.getPlacePredictions(config, (predictions, status) => {
        if (status == google.maps.places.PlacesServiceStatus.OK && predictions) {
          this.places = [];
          predictions.forEach((prediction) => {
            this.places.push(prediction);
          });
        }
      });
    } else {
      this.places = [];
    }
  }

  selectPlace(place) {
    this.placesService = new google.maps.places.PlacesService(this.map);

    this.places = [];

    this.placesService.getDetails({ placeId: place.place_id }, (details) => {
      this.location.id = details.id;
      this.location.name = details.name;
      this.location.lat = details.geometry.location.lat();
      this.location.lng = details.geometry.location.lng();
      this.location.description = details.formatted_address;

      this.query = this.location.name;
    });
  }

}
