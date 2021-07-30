import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketServiceService {

  socket: any;
  // readonly uri: string = "ws://localhost:3000";

  constructor() { 
    // this.socket = io('ws://localhost:3000', { transports : ['websocket'] });
    this.socket = io();
  }

  listen(eventName: string) {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data: any) => {
        subscriber.next(data);
      })
    });
  }

  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }

}