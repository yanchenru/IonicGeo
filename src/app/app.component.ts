import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';
import firebase from 'firebase';
//import { Geofence } from '@ionic-native/geofence';
import { ToastController } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
//import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';

var fbconfig = {
  apiKey: "AIzaSyBf9TgCufrwNYEfPJ6fShLGeMnnFK1hSIM",
  authDomain: "ionic-214905.firebaseapp.com",
  databaseURL: "https://ionic-214905.firebaseio.com",
  projectId: "ionic-214905",
  storageBucket: "ionic-214905.appspot.com",
  messagingSenderId: "121679175196"
};

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

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private toastCtrl: ToastController, 
    private alertCtrl: AlertController, private geolocation: Geolocation) {

    var self = this;

    platform.ready().then(() => {
      statusBar.styleDefault();
      splashScreen.hide();

    });

    firebase.initializeApp(fbconfig);

    var eventRef = firebase.database().ref('event/');
    eventRef.on('value', function (snapshot) {
      self.events = snapshot;
      snapshot.forEach(function (childSnapshot) {
        var childData = childSnapshot.val();

        let startDate = new Date(childData.startDate + ' ' + childData.startTime);
        let endDate = new Date(childData.endDate + ' ' + childData.endTime);
        let proximity = childData.proximity;
        let lat = childData.latitude;
        let lng = childData.longitude;
        let id = childData.id;
        let name = childData.name;
        let description = childData.description;

        //self.addGeofence(id, lat, lng, name, description, proximity, startDate, endDate);
        let fdis = self.calculateDistance(lat, self.latphone, lng, self.lngphone);
        console.log('front ' + fdis);
      });
    });

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
