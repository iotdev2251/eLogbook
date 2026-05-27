import axios from 'axios';
import sinon from 'sinon';
import nock from 'nock';

let axiosAPIClient;

beforeAll((done) => {
    // ️️️✅ Best Practice: Place the backend under test within the same process
    // const apiConnection = await initializeWebServer();
    const axiosConfig = {
        baseURL: `http://127.0.0.1:3000`,
        validateStatus: () => true, //Don't throw HTTP exceptions. Delegate to the tests to decide which error is acceptable
    };
    axiosAPIClient = axios.create(axiosConfig);

    // ️️️✅ Best Practice: Ensure that this component is isolated by preventing unknown calls
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');

    done();
});

afterAll((done) => {
    // ️️️✅ Best Practice: Clean-up resources after each run
    // await stopWebServer();
    nock.enableNetConnect();
    done();
});


describe('/users', function () {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', async () => {
            const getResponse = await axiosAPIClient.get('/startup/mgih')

            expect(getResponse).toMatchObject({
                status: 200,
                data: {
                    target: 'mgih',
                    sysparam: {},
                    i18n: {},
                    domain: {},
                    form: {},
                    target_setting: {}
                }
            })
        });
    });
});