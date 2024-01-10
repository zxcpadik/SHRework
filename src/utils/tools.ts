


class ToolsEx {
  Format(str: string) {
    var args = arguments;
    return str.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number + 1] != 'undefined' ? args[number + 1] : match;
    });
  };

  PadLeft(orig: number, base?: number, chr?: string): number {
    var len = (String(base || 10).length - String(orig).length) + 1;
    return len > 0 ? Number.parseFloat(new Array(len).join(chr || '0')) + orig : orig;
  }

  Clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
  };

  Between(min: number, max: number) {
    return Math.floor(
        Math.random() * (max - min) + min
    )
  }

  GetPathSegments(path: string): string[] {
    let sp = path.split('/');
    for (let i = 0; i < sp.length; i++) {
        if (sp[i] === '' || sp[i] === '/') sp.splice(i, 1);
    }
    return sp;
  }

  MakePath(path: string): string {
    let segs = this.GetPathSegments(path);
    let lpath = '';
    for (let i = 0; i < segs.length; i++) {
        lpath += '\\' + segs[i];
    }
    return lpath;
  }

  GetDateTime(date = new Date()): string {
    return `${this.PadLeft(date.getHours())}:${this.PadLeft(date.getMinutes())}:${this.PadLeft(date.getSeconds())}`
  }
}


export const Tools = new ToolsEx();