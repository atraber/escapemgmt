import { Component } from '@angular/core';
import { Room } from './room';
import { RoomsService } from './rooms.service';

@Component({
    selector: 'carousel-highscore',
    templateUrl: './highscore.component.html',
    styleUrls: ['./highscore.component.css']
})
export class HighscoreComponent {
    rooms: Room[];

    private filterRooms(rooms: Room[]) {
        for (let room of rooms) {
            if (room.scores.length > 5)
                room.scores = room.scores.slice(0, 5);
        }

        return rooms;
    }

    constructor(private roomsService: RoomsService) {
        this.rooms = this.filterRooms(this.roomsService.rooms);

        this.roomsService.roomsUpdated.subscribe(
            (rooms) => {
                this.rooms = this.filterRooms(rooms);
            }
        );
    }
}