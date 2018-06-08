import { Component } from '@angular/core';
import { RoomsService } from './rooms.service';
import { Room } from '../room';

@Component({
    selector: 'app-root',
    templateUrl: './frontscreen.component.html',
    styleUrls: ['./frontscreen.component.css']
})
export class FrontscreenComponent {
    rooms: Room[];
    init_done: Boolean;

    private hasChanged(rooms: Room[]) {
        if (this.rooms.length != rooms.length)
            return true;

        for (var i = 0; i < this.rooms.length; ++i) {
            if (this.rooms[i].description != rooms[i].description
                || this.rooms[i].name != rooms[i].name) {
                return true;
            }

            if (this.rooms[i].scores.length <= 1 && rooms[i].scores.length <= 1) {
                continue;
            }

            if (this.rooms[i].scores[0].name != rooms[i].scores[0].name
                || this.rooms[i].scores[0].time != rooms[i].scores[0].time) {
                return true;
            }
        }

        return false;
    }

    constructor(private roomsService: RoomsService) {
        this.init_done = false;
        this.rooms = this.roomsService.rooms;

        this.roomsService.roomsUpdated.subscribe((rooms) => {
            if (!this.init_done) {
                this.init_done = true;
                this.rooms = rooms;
            } else {
                if (this.hasChanged(rooms)) {
                    console.log("significant change, need to reload");
                    window.location.reload();
                }
            }
        });
    }
}