import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';
import { ToastController } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { BackgroundMode } from '@ionic-native/background-mode';
import firebase from 'firebase';

var fbconfig = {
  apiKey: "AIzaSyBf9TgCufrwNYEfPJ6fShLGeMnnFK1hSIM",
  authDomain: "ionic-214905.firebaseapp.com",
  databaseURL: "https://ionic-214905.firebaseio.com",
  projectId: "ionic-214905",
  storageBucket: "ionic-214905.appspot.com",
  messagingSenderId: "121679175196"
};

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = TabsPage;

  events: any;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private toastCtrl: ToastController,
    private alertCtrl: AlertController, private geolocation: Geolocation, private backgroundMode: BackgroundMode) {
    platform.ready().then(() => {
      statusBar.styleDefault();
      splashScreen.hide();

      this.backgroundMode.enable();
      this.readFirebase();
      this.watchPosition();
    });
  }

  readFirebase() {
    var self = this;

    firebase.initializeApp(fbconfig);

    var eventRef = firebase.database().ref('event/');
    eventRef.once('value').then(function (snapshot) {
      self.events = snapshot;
      // self.watchPosition();
    })
    eventRef.on('value', function (snapshot) {
      self.events = snapshot;
    });
  }

  watchPosition() {
    var self = this;
    this.geolocation.watchPosition().subscribe(position => {
      console.log(position.coords.longitude + ' ' + position.coords.latitude);
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
