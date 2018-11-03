import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Events } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { Geofence } from '@ionic-native/geofence';

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

  constructor(public navCtrl: NavController, public events: Events, private formBuilder: FormBuilder, 
    private toastCtrl: ToastController, private geolocation: Geolocation, private geofence: Geofence) {

    this.eventForm = this.formBuilder.group({
      pickEventStartDate: ['', Validators.required],
      pickEventEndDate: ['', Validators.required],
      pickEventStartTime: ['', Validators.required],
      pickEventFinishTime: ['', Validators.required],
      address: ['', Validators.required],
      proximity: ['', Validators.compose([Validators.required, Validators.pattern('^[0-9]*$')])],
    }, { validator: this.dateLessThan("pickEventStartDate", "pickEventEndDate", "pickEventStartTime", "pickEventFinishTime") });

    events.subscribe('event:created', (eventDuration, time) => {
      console.log('Event is created:', eventDuration, 'at', new Date(time));
      this.presentToast('Event is created at ' + new Date(time))
    });

    geofence.initialize().then(
      // resolved promise does not return a value
      () => console.log('Geofence Plugin Ready'),
      (err) => console.log(err)
    )
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

    this.addGeofence(this.location.id, 1, this.location.lat, this.location.lng, this.location.name, this.location.description)
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

  addGeofence(id, idx, lat, lng, place, desc) {
    let fence = {
      id: id,
      latitude: lat,
      longitude: lng,
      radius: parseInt(this.eventForm.value.proximity),
      transitionType: 3,
      notification: {
        id: idx,
        title: 'You crossed ' + place,
        text: desc,
        openAppOnClick: true
      }
    }

    this.geofence.addOrUpdate(fence).then(
      () => console.log('Geofence added'),
      (err) => console.log('Geofence failed to add')
    );
  }
}
