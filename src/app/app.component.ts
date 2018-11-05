import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';
import firebase from 'firebase';
import { Geofence } from '@ionic-native/geofence';
import { ToastController } from 'ionic-angular';
import { AlertController } from 'ionic-angular';

var config = {
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

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private geofence: Geofence,
    private toastCtrl: ToastController, private alertCtrl: AlertController) {          
    geofence.initialize().then(
      // resolved promise does not return a value
      () => console.log('Geofence Plugin Ready'),
      (err) => console.log(err)
    )

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });
    
    firebase.initializeApp(config);

    var self = this;
    var eventRef = firebase.database().ref('event/');
    eventRef.on('value', function (snapshot) {
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

        self.addGeofence(id, 1, lat, lng, name, description, proximity, startDate, endDate);
      });
    });
  }
  
  addGeofence(id, idx, lat, lng, place, desc, prox, startDate, endDate) {
    let fence = {
      id: id,
      latitude: lat,
      longitude: lng,
      radius: parseInt(prox),
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

    this.geofence.onTransitionReceived().subscribe(resp => {
      console.log('enter event zone');
      this.presentToast(place, startDate, endDate);
    });
  }

  presentToast(place, startDate, endDate) {
    let toast = this.toastCtrl.create({
      message: 'Event at ' + place + ', from ' + startDate + ' to ' + endDate,
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
