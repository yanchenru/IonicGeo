import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';
import firebase from 'firebase';
import { ToastController } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';

var fbconfig = {
  apiKey: "AIzaSyBf9TgCufrwNYEfPJ6fShLGeMnnFK1hSIM",
  authDomain: "ionic-214905.firebaseapp.com",
  databaseURL: "https://ionic-214905.firebaseio.com",
  projectId: "ionic-214905",
  storageBucket: "ionic-214905.appspot.com",
  messagingSenderId: "121679175196"
};

//declare var google;

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = TabsPage;
  // map: any;
  // latphone: any;
  // lngphone: any;
  events: any;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private toastCtrl: ToastController,
    private alertCtrl: AlertController, private bgGeolocation: BackgroundGeolocation) {
    platform.ready().then(() => {
      statusBar.styleDefault();
      splashScreen.hide();
    });
  }

  ngOnInit() {
    var self = this;
    
    firebase.initializeApp(fbconfig);

    var eventRef = firebase.database().ref('event/');
    eventRef.once('value').then(function(snapshot){
      self.events = snapshot;
    })
    eventRef.on('value', function (snapshot) {
      self.events = snapshot;
    });

    const bgconfig: BackgroundGeolocationConfig = {
      desiredAccuracy: 0,
      stationaryRadius: 0,
      distanceFilter: 0,
      debug: true, //  enable this hear sounds for background-geolocation life-cycle.
      //stopOnTerminate: false, // enable this to clear background location settings when the app terminates
      locationProvider: 1,
      interval: 2000,
      fastestInterval: 1000,
      //startForeground: true,
    };

    var preDis = {};
    this.bgGeolocation.configure(bgconfig).subscribe((location: BackgroundGeolocationResponse) => {
      // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
      // and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
      // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
      //this.bgGeolocation.finish(); // FOR IOS ONLY
      
      //console.log('BackgroundGeolocation:  ' + location.latitude + ',' + location.longitude);
      if (self.events != null && self.events != undefined) {
        self.events.forEach(function (event) {
          let distance = self.calculateDistance(event.val().latitude, location.latitude, event.val().longitude, location.longitude);

          //console.log('distance: ' + distance);

          if (preDis[event.val().name] == null) {
            preDis[event.val().name] = 20;
          }
          if (distance < 20 && preDis[event.val().name] >= 20) {
            console.log('background track, enter event zone');
            self.presentToast(event.val().name, event.val().startDate);
          }
          preDis[event.val().name] = distance;
        })
      }
    });

    this.bgGeolocation.start();
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
