    fn is_valid_nums(_num: u32) {
        assert(_num >= 12, "number should be bigger than 11");
        assert(_num <= 987, "number should be lower than 988");

        let mut num = _num;
        let mut modulus: u32 = 100;
        let mut nums: [u32;3] = [0;3];

        for i in 0..3 {
            if ((i == 0) & (num < 100)) {
                nums[i] = 0 as u32;
            } else {
               let subtractor = num - (num % modulus);
               nums[i] = subtractor / modulus;
               num = num - subtractor;
            }

            modulus = modulus / 10;
        }

        assert((nums[0] != nums[1]) & (nums[1] != nums[2]) & (nums[2] != nums[0]), "duplication not allowed");
        assert((nums[0] < 10) & (nums[1] < 10) & (nums[2] < 10), "nums should be less than 10");
    }

    fn check_result(
        _call_num: u32, 
        _secret_num: u32,
    ) -> [u32;2] {

        let mut call_num = _call_num;
        let mut secret_num = _secret_num;

        let mut modulus: u32 = 100;
        let mut call_nums: [u32;3] = [0;3];
        let mut secret_nums: [u32;3] = [0;3];


        for i in 0..3 {
            if ((i == 0) & (call_num < 100)) {
                call_nums[i] = 0 as u32;
            } else {
               let subtractor = call_num - (call_num % modulus);
               call_nums[i] = subtractor / modulus;
               call_num = call_num - subtractor;
            }

            modulus = modulus / 10;
        }

        modulus = 100;

        for i in 0..3 {
            if ((i == 0) & (secret_num < 100)) {
                secret_nums[i] = 0 as u32;
            } else {
               let subtractor = secret_num - (secret_num % modulus);
               secret_nums[i] = subtractor / modulus;
               secret_num = secret_num - subtractor;
            }

            modulus = modulus / 10;
        }

        let mut ret: [u32;2] = [0;2];

        for i in 0..3 {
            
            for j in 0..3 {

                   if (i == j) & (call_nums[i] == secret_nums[j]) {
                    ret[0] = (ret[0] + 1);
                   } 

                   if (i != j) & (call_nums[i] == secret_nums[j]) {
                    ret[1] = (ret[1] + 1);
                   }
            }
        }

        ret
    }

    pub fn _is_valid_nums(_num: u32) -> [u32;3] {
        assert(_num >= 12, "number should be bigger than 11");
        assert(_num <= 987, "number should be lower than 988");

        let mut num = _num as u32;
        let mut modulus: u32 = 100;
        let mut nums: [u32;3] = [0;3];

        for i in 0..3 {
            if ((i == 0) & (num < 100)) {
                nums[i] = 0 as u32;
            } else {
               let subtractor = num - (num % modulus);
               nums[i] = subtractor / modulus;
               num = num - subtractor;
            }

            modulus = modulus / 10;
        }

        assert((nums[0] != nums[1]) & (nums[1] != nums[2]) & (nums[2] != nums[0]), "duplication not allowed");
        assert((nums[0] < 10) & (nums[1] < 10) & (nums[2] < 10), "nums should be less than 10");

        nums
    }

    pub fn _check_result(
        _call_num: u32, 
        _secret_num: u32,
    ) -> [u32;2] {

        let mut call_num = _call_num;
        let mut secret_num = _secret_num;

        let mut modulus: u32 = 100;
        let mut call_nums: [u32;3] = [0;3];
        let mut secret_nums: [u32;3] = [0;3];

        
        for i in 0..3 {
            if ((i == 0) & (call_num < 100)) {
                call_nums[i] = 0 as u32;
            } else {
               let subtractor = call_num - (call_num % modulus);
               call_nums[i] = subtractor / modulus;
               call_num = call_num - subtractor;
            }

            modulus = modulus / 10;
        }

        modulus = 100;

        for i in 0..3 {
            if ((i == 0) & (secret_num < 100)) {
                secret_nums[i] = 0 as u32;
            } else {
               let subtractor = secret_num - (secret_num % modulus);
               secret_nums[i] = subtractor / modulus;
               secret_num = secret_num - subtractor;
            }

            modulus = modulus / 10;
        }

        let mut ret: [u32;2] = [0;2];

        for i in 0..3 {
            
            for j in 0..3 {

                   if (i == j) & (call_nums[i] == secret_nums[j]) {
                    ret[0] = (ret[0] + 1);
                   } 

                   if (i != j) & (call_nums[i] == secret_nums[j]) {
                    ret[1] = (ret[1] + 1);
                   }
            }
        }

        ret
    }

       fn arrarify_num(_num: Field) -> [u32;3] {

        let mut num = _num as u32;

        let mut modulus: u32 = 100;
        let mut nums: [u32;3] = [0;3];

        for i in 0..3 {
            if ((i == 0) & (num < 100)) {
               nums[i] = 0 as u32;
            } else {
               let subtractor = num - (num % modulus);
               nums[i] = subtractor / modulus;
               num = num - subtractor;
            }

            modulus = modulus / 10;
        }

        nums
    }
