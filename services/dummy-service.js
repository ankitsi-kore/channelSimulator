
class DummyService {

    async createDummy(dummyData) {
        try {
            const responseDummy = 'Dummy request is created';
            return responseDummy;
        }
        catch (error) {
            console.log("Something went wrong at service layer");
            throw error;
        }
    }

    async getDummy() {
        try {
            const responseDummy = 'Dummy response is sent';
            return responseDummy;
        }
        catch (error) {
            console.log("Something went wrong at service layer");
            throw error;
        }
    }
}

module.exports = DummyService;