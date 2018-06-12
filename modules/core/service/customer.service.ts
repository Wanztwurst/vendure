import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { PasswordService } from '../auth/password.service';
import { Role } from '../auth/role';
import { Address } from '../entity/address/address.entity';
import { CreateCustomerDto } from '../entity/customer/customer.dto';
import { Customer } from '../entity/customer/customer.entity';
import { User } from '../entity/user/user.entity';

@Injectable()
export class CustomerService {
    constructor(@InjectConnection() private connection: Connection, private passwordService: PasswordService) {}

    findAll(): Promise<Customer[]> {
        return this.connection.manager.find(Customer);
    }

    findOne(userId: number): Promise<Customer | undefined> {
        return this.connection.manager.findOne(Customer, userId);
    }

    findAddressesByCustomerId(customerId: number): Promise<Address[]> {
        return this.connection
            .getRepository(Address)
            .createQueryBuilder('address')
            .where('address.customerId = :id', { id: customerId })
            .getMany();
    }

    async create(createCustomerDto: CreateCustomerDto, password?: string): Promise<Customer> {
        const customer = new Customer(createCustomerDto);

        if (password) {
            const user = new User();
            user.passwordHash = await this.passwordService.hash(password);
            user.identifier = createCustomerDto.emailAddress;
            user.roles = [Role.Customer];
            const createdUser = await this.connection.getRepository(User).save(user);
            customer.user = createdUser;
        }

        return this.connection.getRepository(Customer).save(customer);
    }
}
