import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Events } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';

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
  autocompleteService: any;
  placesService: any;

  constructor(public navCtrl: NavController, public events: Events, private formBuilder: FormBuilder, private toastCtrl: ToastController,
    private geolocation: Geolocation) {
    //google places api key: AIzaSyCaPTxflgChk2KXjvlvXp70PBYftr5bCXc
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
      this.presentToast('Event is created at ' + new Date(time))
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
    //console.log('init')
    this.geolocation.getCurrentPosition().then((position) => {
      let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      let mapOptions = {
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }

      this.map = new google.maps.Map(this.mapElement, mapOptions);
    }).catch((error) => {
      console.log('Error getting location', error);
    });
  }

  create() {
    //console.log(this.pickEventStartDate, this.pickEventEndDate, this.pickEventStartTime, this.pickEventFinishTime, this.address, this.proximity);
    //console.log(this.eventForm.value)
    this.eventDuration = true;

    this.events.publish('event:created', this.eventDuration, Date.now());

    let watch = this.geolocation.watchPosition();
    watch.subscribe((data) => {
      // data can be a set of coordinates, or an error (if an error occurred).
      console.log(data.coords.latitude)
      console.log(data.coords.longitude)
    });
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
    //console.log('1')
    if (this.query.length > 0) {
      let config = {
        types: ['geocode'],
        input: this.query
      }
      //console.log('2')
      this.autocompleteService.getPlacePredictions(config, (predictions, status) => {
        if (status == google.maps.places.PlacesServiceStatus.OK && predictions) {
          //console.log('3', predictions)
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

    let location = {
      lat: null,
      lng: null,
      name: place.name
    };

    this.placesService.getDetails({ placeId: place.place_id }, (details) => {
      location.name = details.name;
      location.lat = details.geometry.location.lat();
      location.lng = details.geometry.location.lng();
      console.log(details)
    });
  }
}
