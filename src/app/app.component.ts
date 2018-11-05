import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';
import firebase from 'firebase';
import { Geofence } from '@ionic-native/geofence';

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

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private geofence: Geofence) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });
        
    geofence.initialize().then(
      // resolved promise does not return a value
      () => console.log('Geofence Plugin Ready'),
      (err) => console.log(err)
    )

    firebase.initializeApp(config);

    var self = this;
    var eventRef = firebase.database().ref('event/');
    eventRef.on('value', function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
        // var childKey = childSnapshot.key;
        var childData = childSnapshot.val();

        // let currentDate = new Date();
        // let startDate = new Date(childData.startDate + ' ' + childData.startTime);
        // let endDate = new Date(childData.endDate + ' ' + childData.endTime);
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

        self.addGeofence(id, 1, lat, lng, name, description, proximity);
      });
    });

  }
  
  addGeofence(id, idx, lat, lng, place, desc, prox) {
    let fence = {
      id: id,
      latitude: lat,
      longitude: lng,
      radius: parseInt(prox),
      transitionType: 1,
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
      
    });
  }
 }
