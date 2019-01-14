import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';
import { Geofence } from '@ionic-native/geofence';
import { ToastController } from 'ionic-angular';
import { AlertController } from 'ionic-angular';

import firebase from 'firebase';

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
    private toastCtrl: ToastController, private alertCtrl: AlertController) {
    platform.ready().then(() => {
      statusBar.styleDefault();
      splashScreen.hide();
    });
  }

  ngOnInit() {
    let self = this;

    self.geofence.initialize().then(
      () => console.log('Geofence Plugin Ready'),
      (err) => console.log(err)
    )

    var fbconfig = {
      apiKey: "AIzaSyBf9TgCufrwNYEfPJ6fShLGeMnnFK1hSIM",
      authDomain: "ionic-214905.firebaseapp.com",
      databaseURL: "https://ionic-214905.firebaseio.com",
      projectId: "ionic-214905",
      storageBucket: "ionic-214905.appspot.com",
      messagingSenderId: "121679175196"
    };

    firebase.initializeApp(fbconfig);

    var eventRef = firebase.database().ref('event/');
    eventRef.on('value', function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
        var childData = childSnapshot.val();

        let startDate = new Date(childData.startDate + ' ' + childData.startTime);
        let endDate = new Date(childData.endDate + ' ' + childData.endTime);
        let proximity = childData.proximity;
        let lat = childData.latitude;
        let lng = childData.longitude;
        //let id = childData.id;
        let name = childData.name;
        //let description = childData.description;

        self.addGeofence(lat, lng, name, proximity, startDate, endDate);
        //let fdis = self.calculateDistance(lat, self.latphone, lng, self.lngphone);
        //console.log('front ' + fdis);
      });
    });
  }

  create_UUID() {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  }

  addGeofence(lat, lng, name, prox, startDate, endDate) {
    this.geofence.onTransitionReceived().subscribe(resp => {
      console.log('enter event zone');
      this.presentToast(name, startDate);
    });

    let fence = {
      id: this.create_UUID(),
      latitude: lat,
      longitude: lng,
      radius: parseInt(prox),
      transitionType: 3,
      notification: {
        //id: nid,
        title: 'You crossed ' + name,
        text: 'You just arrived to' + name,
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
