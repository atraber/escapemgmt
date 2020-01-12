import {ScoresService} from './scores.service';

describe('ScoresService without Angular testing support', () => {
  let scoresService: ScoresService;

  it('constructor should fetch data from http client spy', () => {
    // create `get` spy on an object representing the ValueService
    const httpClientSpy = jasmine.createSpyObj('HttpClient', [ 'get' ]);

    const stubValue = [];
    httpClientSpy.get.and.returnValue(stubValue);

    scoresService = new ScoresService(httpClientSpy);

    expect(scoresService.rooms).toBe(stubValue, 'service returned stub value');
    expect(httpClientSpy.get.calls.count())
        .toBe(1, 'spy method was called once');
    expect(httpClientSpy.get.calls.mostRecent().returnValue).toBe(stubValue);
  });
});
