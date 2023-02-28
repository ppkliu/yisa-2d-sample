import { CCFloat, Component, Node, Pool, Prefab, RigidBody2D, Vec2, Vec3, _decorator, find, game, instantiate, v2, v3 } from "cc";
import { Projectile } from "./Projectile";
import { Actor } from "../Actor";
const { ccclass, property } = _decorator;

export enum ProjectileEventType {
    onProjectileDead = 'onProjectileDead',
}

@ccclass('SimpleEmitter')
export class SimpleEmitter extends Component {

    @property(Node)
    emitterRoot: Node | null = null;

    @property(Prefab)
    projectilePrefab: Prefab | null = null;

    @property(CCFloat)
    startLinearSpeed: number = 0;

    @property(CCFloat)
    startAngularVelocity: number = 20;

    actor: Actor = null;

    projectilePool: Pool<Node> | null = null;

    cooldown: number = 5;

    castTime: number = 0;

    start() {
        this.projectilePool = new Pool((): Node => {
            let n = instantiate(this.projectilePrefab!);
            n.active = false;
            return n;
        }, 10, (n: Node) => {
            n.destroy();
        });
    }

    onDestroy() {
        this.projectilePool.destroy();
    }

    get isCoolingdown(): boolean {
        return game.totalTime - this.castTime > this.cooldown * 1000;
    }

    emit() {
        this.castTime = game.totalTime;
        for (let i = 0; i < this.emitterRoot.children.length; i++) {
            let emitNode = this.emitterRoot.children[i];
            if (!emitNode.active) {
                continue;
            }
            let wr = emitNode.worldRotation;
            let node = this.projectilePool.alloc();//instantiate(this.projectilePrefab);
            node.active = true;

            find('LevelCanvas').addChild(node);

            let left = Vec3.UNIT_X;
            let velocityV3 = v3();
            Vec3.transformQuat(velocityV3, left, wr);

            let rigid = node.getComponent(RigidBody2D);
            let velocity: Vec2 = v2();
            velocity.x = velocityV3.x;
            velocity.y = velocityV3.y;
            velocity.multiplyScalar(this.startLinearSpeed);

            rigid.linearVelocity = velocity;
            rigid.angularVelocity = this.startAngularVelocity;

            node.worldPosition = emitNode.worldPosition;

            let projectile = node.getComponent(Projectile);
            projectile.host = this.actor;

            node.once(ProjectileEventType.onProjectileDead, this.onProjectileDead, this);
        }
    }

    onProjectileDead(n: Node) {
        n.active = false;
        this.projectilePool.free(n);
    }
}