import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';
import firebase from 'firebase';
import { Geofence } from '@ionic-native/geofence';
import { ToastController } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';

var fbconfig = {
  apiKey: "AIzaSyBf9TgCufrwNYEfPJ6fShLGeMnnFK1hSIM",
  authDomain: "ionic-214905.firebaseapp.com",
  databaseURL: "https://ionic-214905.firebaseio.com",
  projectId: "ionic-214905",
  storageBucket: "ionic-214905.appspot.com",
  messagingSenderId: "121679175196"
};
//var nid = 0;
declare var google;
@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = TabsPage;
  map: any;
  latphone: any;
  lngphone: any;
  events: any;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private geofence: Geofence,
    private toastCtrl: ToastController, private alertCtrl: AlertController, private geolocation: Geolocation,
    private bgGeolocation: BackgroundGeolocation) {

    var self = this;

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();

    });

    firebase.initializeApp(fbconfig);

    var eventRef = firebase.database().ref('event/');
    eventRef.on('value', function (snapshot) {
      self.events = snapshot;
      snapshot.forEach(function (childSnapshot) {
        // var childKey = childSnapshot.key;
        var childData = childSnapshot.val();

        // let currentDate = new Date();
        let startDate = new Date(childData.startDate + ' ' + childData.startTime);
        let endDate = new Date(childData.endDate + ' ' + childData.endTime);
        // console.log(currentDate);
        // console.log(startDate);
        // console.log(endDate);
        // if (currentDate >= startDate && currentDate <= endDate) {
        //   if (true) {
        //     console.log('good');
        //   }
        // }
        let proximity = childData.proximity;
        let lat = childData.latitude;
        let lng = childData.longitude;
        let id = childData.id;
        let name = childData.name;
        let description = childData.description;

        self.addGeofence(id, lat, lng, name, description, proximity, startDate, endDate);
        //debugger;
        let fdis = self.calculateDistance(lat, self.latphone, lng, self.lngphone);
        console.log('front ' + fdis);

        // let bgdis = self.calculateDistance(lat, self.latbg, lng, self.lngbg);
        // console.log('back ' + bgdis);
        // if (bgdis < 20) {
        //   console.log('background track, enter event zone');
        //   self.presentToast(name, startDate, endDate);
        // }
      });
    });


    geofence.initialize().then(
      // resolved promise does not return a value
      () => console.log('Geofence Plugin Ready'),
      (err) => console.log(err)
    )


    const bgconfig: BackgroundGeolocationConfig = {
      desiredAccuracy: 0,
      stationaryRadius: 1,
      distanceFilter: 1,
      debug: true, //  enable this hear sounds for background-geolocation life-cycle.
      stopOnTerminate: false, // enable this to clear background location settings when the app terminates
      // locationProvider: 1,
      // interval: 1000,
      // fastestInterval: 1000,
    };


    var preDis = {};
    bgGeolocation.configure(bgconfig).subscribe((location: BackgroundGeolocationResponse) => {
      // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
      // and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
      // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
      //this.bgGeolocation.finish(); // FOR IOS ONLY
      //debugger;
      console.log('BackgroundGeolocation:  ' + location.latitude + ',' + location.longitude);

      if (self.events != null) {
        self.events.forEach(function (event) {
          let bgDis = self.calculateDistance(event.val().latitude, location.latitude, event.val().longitude, location.longitude);

          console.log('back distance: ' + bgDis);
          //debugger;
          if (preDis[event.val().id] == null) {
            preDis[event.val().id] = 20;
          }
          //alert('bg' + bgDis);
          if (bgDis < 6 && preDis[event.val().id] >= 6) {
            console.log('background track, enter event zone');
            self.presentToast(event.val().name, event.val().startDate);
          }
          preDis[event.val().id] = bgDis;
        })
      }
    });

    this.bgGeolocation.start();


    geolocation.getCurrentPosition().then((position) => {
      let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      console.log('front ' + position.coords.latitude + ',' + position.coords.longitude);
      this.latphone = position.coords.latitude;
      this.lngphone = position.coords.longitude;

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

  calculateDistance(lat1, lat2, lng1, lng2) {
    let p = 0.017453292519943295;    // Math.PI / 180
    let c = Math.cos;
    let a = 0.5 - c((lat1 - lat2) * p) / 2 + c(lat2 * p) * c((lat1) * p) * (1 - c(((lng1 - lng2) * p))) / 2;
    let dis = (12742 * Math.asin(Math.sqrt(a))); // 2 * R; R = 6371 km

    return dis * 1000;
  }

  addGeofence(id, lat, lng, place, desc, prox, startDate, endDate) {
    this.geofence.onTransitionReceived().subscribe(resp => {
      console.log('enter event zone');
      this.presentToast(place, startDate);
    });

    //nid = nid + 1;
    let fence = {
      id: id,
      latitude: lat,
      longitude: lng,
      radius: parseInt(prox),
      transitionType: 3,
      notification: {
        //id: nid,
        //title: 'You crossed ' + place,
        text: desc,
        openAppOnClick: false,
        autoClear: true
        //data: nid
      }
    }

    this.geofence.addOrUpdate(fence).then(
      () => { console.log('Geofence added') },
      (err) => console.log('Geofence failed to add')
    );

  }

  presentToast(place, startDate) {
    let toast = this.toastCtrl.create({
      message: 'Event at ' + place + ', on ' + startDate,
      duration: 10000,
      position: 'top',
      showCloseButton: true,
      closeButtonText: 'Join'
    });

    toast.onDidDismiss((data, role) => {
      if (role == 'close') {
        let alert = this.alertCtrl.create({
          title: 'Welcome',
          subTitle: 'Looking forward to see you',
          buttons: ['Dismiss']
        });
        alert.present();
      }
    });

    toast.present();
  }
}
